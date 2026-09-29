import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { type Response } from "express";
import { env } from "../../env.config.js";
import { ApiError } from "../../utils/ApiError.js";
import { User, type IUserDocument } from "../user/user.model.js";
import { Card } from "../card/card.model.js";
import { OtpService } from "../otp/otp.service.js";
import {
  type SignupInput,
  type VerifyOtpInput,
  type ResendOtpInput,
  type LoginInput,
  sanitizeMobileNumber,
} from "./auth.validation.js";

export interface TokenPayload {
  id: string;
  mobile: string;
  role: string;
  userType: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Generates paired Access (short-lived) and Refresh (long-lived) tokens.
   */
  public static generateTokens(user: IUserDocument | { _id: string; mobile: string; role: string; userType: string }): AuthTokens {
    const payload: TokenPayload = {
      id: user._id.toString(),
      mobile: user.mobile,
      role: user.role,
      userType: user.userType,
    };

    const accessSecret = env.JWT_ACCESS_SECRET;
    const refreshSecret = env.JWT_REFRESH_SECRET;

    const accessSignOptions: jwt.SignOptions = {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    };

    const refreshSignOptions: jwt.SignOptions = {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    };

    const accessToken = jwt.sign(payload, accessSecret, accessSignOptions);
    const refreshToken = jwt.sign(payload, refreshSecret, refreshSignOptions);

    return { accessToken, refreshToken };
  }

  /**
   * Sets secure, HTTP-only authentication cookies on the Express response.
   */
  public static setAuthCookies(res: Response, tokens: AuthTokens): void {
    const isProduction = env.NODE_ENV === "production";

    // 15 minutes access token cookie
    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    // 7 days refresh token cookie restricted to auth paths
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/api/v1/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  /**
   * Clears authentication cookies upon logout.
   */
  public static clearAuthCookies(res: Response): void {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken", { path: "/api/v1/auth" });
  }

  /**
   * Handles non-Aptech student registration initiation.
   * If an unverified registration exists, updates profile and dispatches a fresh OTP.
   */
  public static async signup(data: SignupInput) {
    const existingUser = await User.findOne({ mobile: data.mobile });

    if (existingUser && existingUser.isMobileVerified) {
      throw ApiError.conflict("An account with this mobile number already exists. Please login instead.");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    let user: IUserDocument;

    if (existingUser && !existingUser.isMobileVerified) {
      // Prior uncompleted signup: update details and re-send OTP
      existingUser.name = data.name;
      existingUser.email = data.email;
      existingUser.highestEducation = data.highestEducation;
      existingUser.passwordHash = passwordHash;
      user = await existingUser.save();
    } else {
      // New user signup
      user = await User.create({
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        highestEducation: data.highestEducation,
        passwordHash,
        isMobileVerified: false,
        status: "pending_verification",
        userType: "non_aptech_student",
        role: "student",
      });
    }

    // Generate & send OTP
    const otpResult = await OtpService.generateAndSendOtp(user.mobile, "SIGNUP_VERIFICATION");

    return {
      message: "Registration initiated. Verification OTP has been sent to your mobile number.",
      mobile: user.mobile,
      isNewUser: !existingUser,
      ...(otpResult.otpForDev ? { debugOtp: otpResult.otpForDev } : {}),
    };
  }

  /**
   * Verifies mobile OTP, activates user account, initializes lean Card linkage, and issues tokens.
   */
  public static async verifyOtp(data: VerifyOtpInput) {
    const user = await User.findOne({ mobile: data.mobile });

    if (!user) {
      throw ApiError.notFound("No account found with this mobile number. Please complete signup first.");
    }

    // Verify OTP against secure hash & TTL
    await OtpService.verifyOtp(data.mobile, data.otp, "SIGNUP_VERIFICATION");

    // Activate user
    user.isMobileVerified = true;
    user.status = "active";
    await user.save();

    // Initialize or get lean student card linkage
    const card = await Card.findOneAndUpdate(
      { userId: user._id },
      {
        $setOnInsert: {
          userId: user._id,
          status: "NOT_APPLIED",
          cardType: "VIRTUAL",
          kycStatus: "MIN_KYC",
          isLocked: false,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    // Generate Access & Refresh tokens
    const tokens = this.generateTokens(user);

    return {
      message: "Mobile verified successfully. Welcome to Aptech Student Card dashboard!",
      token: tokens.accessToken,
      tokens,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        highestEducation: user.highestEducation,
        isMobileVerified: user.isMobileVerified,
        status: user.status,
        userType: user.userType,
        role: user.role,
      },
      card: {
        status: card.status,
        cardType: card.cardType,
        kycStatus: card.kycStatus,
        maskedPan: card.maskedPan,
      },
    };
  }

  /**
   * Resends verification OTP to the user's mobile number.
   */
  public static async resendOtp(data: ResendOtpInput) {
    const user = await User.findOne({ mobile: data.mobile });

    if (!user) {
      throw ApiError.notFound("No account found with this mobile number. Please sign up first.");
    }

    if (user.isMobileVerified) {
      throw ApiError.badRequest("Your mobile number is already verified. Please proceed to login.");
    }

    const otpResult = await OtpService.generateAndSendOtp(user.mobile, "SIGNUP_VERIFICATION");

    return {
      message: "A new OTP has been dispatched to your registered mobile number.",
      mobile: user.mobile,
      ...(otpResult.otpForDev ? { debugOtp: otpResult.otpForDev } : {}),
    };
  }

  /**
   * Authenticates an existing student using registered Mobile Number or Email + Password.
   */
  public static async login(data: LoginInput) {
    const rawIdentifier = data.identifier.trim();
    const sanitizedMobile = sanitizeMobileNumber(rawIdentifier);
    const isMobile = /^[6-9]\d{9}$/.test(sanitizedMobile);

    const query = isMobile
      ? { mobile: sanitizedMobile }
      : { email: rawIdentifier.toLowerCase() };

    const user = await User.findOne(query).select("+passwordHash");

    if (!user) {
      throw ApiError.unauthorized("Invalid credentials entered.");
    }

    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid credentials entered.");
    }

    if (!user.isMobileVerified) {
      throw new ApiError(
        403,
        "Mobile number has not been verified. Please complete verification before logging in."
      );
    }

    if (user.status === "suspended") {
      throw ApiError.forbidden("Your account is currently suspended. Please contact support.");
    }

    // Fetch card status
    const card = await Card.findOne({ userId: user._id });

    // Generate Access & Refresh tokens
    const tokens = this.generateTokens(user);

    return {
      message: "Login successful.",
      token: tokens.accessToken,
      tokens,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        highestEducation: user.highestEducation,
        isMobileVerified: user.isMobileVerified,
        status: user.status,
        userType: user.userType,
        role: user.role,
      },
      card: {
        status: card?.status ?? "NOT_APPLIED",
        cardType: card?.cardType ?? "VIRTUAL",
        kycStatus: card?.kycStatus ?? "MIN_KYC",
        maskedPan: card?.maskedPan ?? null,
      },
    };
  }

  /**
   * Refreshes an expired access token using the HTTP-only refresh token.
   */
  public static async refreshSession(refreshTokenString?: string) {
    if (!refreshTokenString) {
      throw ApiError.unauthorized("Refresh token is missing. Please log in again.");
    }

    const refreshSecret = env.JWT_REFRESH_SECRET;
    let decoded: TokenPayload;

    try {
      decoded = jwt.verify(refreshTokenString, refreshSecret) as TokenPayload;
    } catch {
      throw ApiError.unauthorized("Invalid or expired refresh token. Please log in again.");
    }

    const user = await User.findById(decoded.id);
    if (!user || user.status === "suspended") {
      throw ApiError.unauthorized("User session is no longer active. Please log in again.");
    }

    const tokens = this.generateTokens(user);

    return {
      token: tokens.accessToken,
      tokens,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        highestEducation: user.highestEducation,
        isMobileVerified: user.isMobileVerified,
        status: user.status,
        userType: user.userType,
        role: user.role,
      },
    };
  }

  /**
   * Returns current authenticated student profile and card status.
   */
  public static async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound("User not found.");
    }

    const card = await Card.findOne({ userId: user._id });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        highestEducation: user.highestEducation,
        isMobileVerified: user.isMobileVerified,
        status: user.status,
        userType: user.userType,
        role: user.role,
      },
      card: {
        status: card?.status ?? "NOT_APPLIED",
        cardType: card?.cardType ?? "VIRTUAL",
        kycStatus: card?.kycStatus ?? "MIN_KYC",
        maskedPan: card?.maskedPan ?? null,
      },
    };
  }
}
