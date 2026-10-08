import jwt from "jsonwebtoken";
import { type Response } from "express";
import { env } from "../../env.config.js";
import { ApiError } from "../../utils/ApiError.js";
import { User, type IUserDocument } from "../user/user.model.js";
import { Card } from "../card/card.model.js";
import { ProconnectFactory, type ProconnectStudentProfile } from "../../services/proconnect/index.js";
import { sanitizeMobileNumber } from "./auth.validation.js";

export interface TokenPayload {
  id: string;
  mobile: string;
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
  public static generateTokens(user: IUserDocument | { _id: unknown; mobile: string; userType: string }): AuthTokens {
    const payload: TokenPayload = {
      id: user._id ? user._id.toString() : "",
      mobile: user.mobile,
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
   * Refreshes an expired access token using the HTTP-only refresh token.
   */
  public static async refreshSession(refreshTokenString?: string) {
    if (!refreshTokenString) {
      throw ApiError.unauthorized("Refresh token is missing. Please log in again via Aptech ProConnect.");
    }

    const refreshSecret = env.JWT_REFRESH_SECRET;
    let decoded: TokenPayload;

    try {
      decoded = jwt.verify(refreshTokenString, refreshSecret) as TokenPayload;
    } catch {
      throw ApiError.unauthorized("Invalid or expired session. Please log in again via Aptech ProConnect.");
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized("User session is no longer active. Please log in again via Aptech ProConnect.");
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
        studentId: user.studentId,
        userType: user.userType,
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
        studentId: user.studentId,
        userType: user.userType,
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
   * Exchanges an authorization code from Aptech ProConnect for student identity,
   * performs automatic account linking and card discovery, and establishes a TBX session.
   */
  public static async exchangeProconnectCode(code: string) {
    const provider = ProconnectFactory.getProvider();
    const studentProfile = await provider.exchangeCode(code);

    const sanitizedMobile = sanitizeMobileNumber(studentProfile.mobile);
    if (!sanitizedMobile || !/^[6-9]\d{9}$/.test(sanitizedMobile)) {
      throw ApiError.badRequest("Invalid student mobile number received from ProConnect.");
    }

    // Step 1: Look for existing student by studentId, mobile, or email (priority to studentId)
    let user = await User.findOne({ studentId: studentProfile.studentId });
    if (!user) {
      user = await User.findOne({ mobile: sanitizedMobile });
    }
    if (!user && studentProfile.email) {
      user = await User.findOne({ email: studentProfile.email.toLowerCase().trim() });
    }

    if (user) {
      // Step 2a: Automatic Account Linking
      // Ensure studentId and verified contact details are in sync with ProConnect
      user.studentId = studentProfile.studentId;
      user.mobile = sanitizedMobile;
      user.userType = "aptech_student";
      if (!user.name && studentProfile.name) {
        user.name = studentProfile.name;
      }
      if (studentProfile.email && user.email !== studentProfile.email.toLowerCase().trim()) {
        user.email = studentProfile.email.toLowerCase().trim();
      }
      await user.save();
    } else {
      // Step 2b: New Aptech student onboarding via SSO
      user = await User.create({
        name: studentProfile.name,
        email: studentProfile.email.toLowerCase().trim(),
        mobile: sanitizedMobile,
        studentId: studentProfile.studentId,
        userType: "aptech_student",
      });
    }

    // Step 3: Card verification & automatic initialization
    const card = await Card.findOneAndUpdate(
      { userId: user._id },
      {
        $setOnInsert: {
          userId: user._id,
          status: "NOT_APPLIED",
          cardType: "VIRTUAL",
          kycStatus: "MIN_KYC",
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    const isCardIssued = card.status !== "NOT_APPLIED" && card.status !== "APPLICATION_PENDING";

    // Step 4: Issue standard TBX JWT Access & Refresh Tokens
    const tokens = this.generateTokens(user);

    return {
      message: isCardIssued
        ? "ProConnect SSO successful. Welcome back to your card dashboard!"
        : "ProConnect SSO successful. Student verified.",
      token: tokens.accessToken,
      tokens,
      isCardIssued,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        studentId: user.studentId,
        userType: user.userType,
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
   * Generates a mock ProConnect SSO authorization code for local development and testing.
   */
  public static async simulateProconnectCode(profile?: Partial<ProconnectStudentProfile>) {
    const provider = ProconnectFactory.getProvider();
    if (!provider.generateMockCode) {
      throw ApiError.badRequest("Simulate code is only available when using mock ProConnect provider.");
    }
    const code = await provider.generateMockCode(profile);
    return {
      code,
      redirectUrl: `${env.CLIENT_URL}/sso/callback?code=${code}`,
    };
  }
}
