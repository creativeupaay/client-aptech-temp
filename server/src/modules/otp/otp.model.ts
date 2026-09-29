import mongoose, { type Document, type Model, Schema } from "mongoose";

export const OTP_PURPOSES = ["SIGNUP_VERIFICATION", "LOGIN", "PASSWORD_RESET"] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export interface IOtp {
  mobile: string;
  otpHash: string;
  purpose: OtpPurpose;
  attempts: number;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOtpDocument extends IOtp, Document {}

const otpSchema = new Schema<IOtpDocument>(
  {
    mobile: {
      type: String,
      required: [true, "Mobile is required for OTP"],
      index: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: [true, "OTP hash is required"],
    },
    purpose: {
      type: String,
      enum: OTP_PURPOSES,
      default: "SIGNUP_VERIFICATION",
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: auto-purged by MongoDB
    },
  },
  {
    timestamps: true,
  }
);

export const Otp: Model<IOtpDocument> = mongoose.model<IOtpDocument>("Otp", otpSchema);
