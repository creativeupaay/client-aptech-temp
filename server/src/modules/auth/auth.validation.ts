import { z } from "zod";
import { HIGHEST_EDUCATION_OPTIONS } from "../user/user.model.js";

// Helper function to sanitize Indian mobile numbers
export const sanitizeMobileNumber = (val: unknown): string => {
  if (typeof val !== "string") return "";
  let cleaned = val.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("+91")) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith("91") && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
};

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Full name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Email address is required")
      .email("Please enter a valid email address")
      .toLowerCase(),
    mobile: z
      .string()
      .min(1, "Mobile number is required")
      .transform(sanitizeMobileNumber)
      .refine((val) => /^[6-9]\d{9}$/.test(val), {
        message: "Please enter a valid 10-digit mobile number",
      }),
    highestEducation: z.enum(
      HIGHEST_EDUCATION_OPTIONS,
      "Please select a valid highest education qualification"
    ),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Confirm password does not match password",
    path: ["confirmPassword"],
  });

export const verifyOtpSchema = z.object({
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .transform(sanitizeMobileNumber)
    .refine((val) => /^[6-9]\d{9}$/.test(val), {
      message: "Please enter a valid 10-digit mobile number",
    }),
  otp: z
    .string()
    .trim()
    .min(1, "OTP code is required")
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must consist of 6 numeric digits"),
});

export const resendOtpSchema = z.object({
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .transform(sanitizeMobileNumber)
    .refine((val) => /^[6-9]\d{9}$/.test(val), {
      message: "Please enter a valid 10-digit mobile number",
    }),
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Mobile number or email address is required"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

