import bcrypt from "bcryptjs";
import crypto from "crypto";
import { env } from "../../env.config.js";
import { ApiError } from "../../utils/ApiError.js";
import { SmsFactory } from "../../services/sms/sms.factory.js";
import { Otp, type OtpPurpose } from "./otp.model.js";

const MAX_OTP_ATTEMPTS = 3;

export class OtpService {
  /**
   * Generates a 6-digit secure numeric OTP, saves the hash in DB, and dispatches via SMS service.
   */
  public static async generateAndSendOtp(
    mobile: string,
    purpose: OtpPurpose = "SIGNUP_VERIFICATION"
  ): Promise<{ success: boolean; otpForDev?: string }> {
    // Generate secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);

    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Overwrite existing active OTP for this mobile and purpose
    await Otp.findOneAndUpdate(
      { mobile, purpose },
      {
        otpHash,
        attempts: 0,
        expiresAt,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );


    // Send via SMS service provider (MockSmsProvider logs to console)
    const smsProvider = SmsFactory.getProvider();
    await smsProvider.sendOtp(mobile, rawOtp);

    return {
      success: true,
      otpForDev: env.NODE_ENV !== "production" ? rawOtp : undefined,
    };
  }

  /**
   * Verifies an OTP entered by the user. Throws an ApiError on validation failure.
   */
  public static async verifyOtp(
    mobile: string,
    enteredOtp: string,
    purpose: OtpPurpose = "SIGNUP_VERIFICATION"
  ): Promise<boolean> {
    const record = await Otp.findOne({ mobile, purpose });

    if (!record) {
      throw ApiError.badRequest("OTP has expired or is invalid. Please request a new OTP.");
    }

    if (new Date() > record.expiresAt) {
      await Otp.deleteOne({ _id: record._id });
      throw ApiError.badRequest("OTP has expired. Please request a new OTP.");
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      await Otp.deleteOne({ _id: record._id });
      throw ApiError.badRequest("Maximum OTP verification attempts exceeded. Please request a new OTP.");
    }

    const isMatch = await bcrypt.compare(enteredOtp, record.otpHash);

    if (!isMatch) {
      record.attempts += 1;
      await record.save();
      const attemptsRemaining = MAX_OTP_ATTEMPTS - record.attempts;
      throw ApiError.badRequest(
        `Invalid OTP entered. ${attemptsRemaining > 0 ? `${attemptsRemaining} attempt(s) remaining.` : "Please request a new OTP."}`
      );
    }

    // OTP matched successfully: delete it so it cannot be replayed
    await Otp.deleteOne({ _id: record._id });
    return true;
  }
}
