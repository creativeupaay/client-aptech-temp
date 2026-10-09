import { z } from "zod";

// Helper regexes for Indian telecom, names, and document standards
const indianMobileRegex = /^[6-9]\d{9}$/;
const legalNameRegex = /^[a-zA-Z\s.'-]+$/;
const aadhaarRegex = /^\d{12}$/;
const passportRegex = /^[A-Z][0-9]{7}$/;
const voterIdRegex = /^[A-Z]{3}[0-9]{7}$/;
const drivingLicenceRegex = /^[A-Z0-9]{10,16}$/;

export const sendCardOtpSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits")
    .regex(indianMobileRegex, "Mobile number must start with 6, 7, 8, or 9"),
});

export const registerAndIssueCardSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Full legal name must be at least 2 characters")
      .max(100, "Full legal name cannot exceed 100 characters")
      .regex(
        legalNameRegex,
        "Name can only contain letters, spaces, dots, hyphens, and apostrophes"
      ),
    email: z
      .string()
      .trim()
      .email("A valid email address is required")
      .max(254, "Email address cannot exceed 254 characters"),
    mobile: z
      .string()
      .trim()
      .regex(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits")
      .regex(indianMobileRegex, "Mobile number must start with 6, 7, 8, or 9"),
    documentType: z.enum(
      ["AADHAR_NUMBER", "DRIVING_LICENCE", "PASSPORT_NUMBER", "VOTER_ID"],
      {
        error: () => ({
          message:
            "Allowed document types: AADHAR_NUMBER, DRIVING_LICENCE, PASSPORT_NUMBER, VOTER_ID",
        }),
      }
    ),
    documentValue: z
      .string()
      .trim()
      .min(1, "Document identifier is required"),
    dateOfBirth: z
      .string()
      .trim()
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        // Normalize DD/MM/YYYY or DD / MM / YYYY or DD-MM-YYYY to YYYY-MM-DD
        const cleaned = val.replace(/\s+/g, "");
        const ddmmyyyy = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (ddmmyyyy && ddmmyyyy[1] && ddmmyyyy[2] && ddmmyyyy[3]) {
          const [, day, month, year] = ddmmyyyy;
          return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
        return cleaned;
      }),
    otp: z
      .string()
      .trim()
      .min(4, "OTP must be at least 4 digits")
      .max(6, "OTP cannot exceed 6 digits")
      .regex(/^\d{4,6}$/, "OTP must consist of numeric digits only"),
    termsAccepted: z
      .boolean()
      .refine(
        (val) => val === true,
        "You must accept the Terms of Service and Privacy Policy"
      ),
  })
  .superRefine((data, ctx) => {
    // 1. Document validation based on selected documentType
    const cleanDoc = data.documentValue.replace(/\s+/g, "").toUpperCase();

    switch (data.documentType) {
      case "AADHAR_NUMBER":
        if (!aadhaarRegex.test(cleanDoc)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Aadhaar number must be exactly 12 numeric digits",
            path: ["documentValue"],
          });
        }
        break;
      case "PASSPORT_NUMBER":
        if (!passportRegex.test(cleanDoc)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Passport number must be 1 letter followed by 7 digits (e.g. A1234567)",
            path: ["documentValue"],
          });
        }
        break;
      case "VOTER_ID":
        if (!voterIdRegex.test(cleanDoc)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Voter ID must be 3 letters followed by 7 digits (e.g. ABC1234567)",
            path: ["documentValue"],
          });
        }
        break;
      case "DRIVING_LICENCE":
        if (!drivingLicenceRegex.test(cleanDoc)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Driving Licence must be between 10 and 16 alphanumeric characters",
            path: ["documentValue"],
          });
        }
        break;
    }

    // 2. Date of Birth validation (if provided)
    if (data.dateOfBirth) {
      let year: number;
      let month: number;
      let day: number;

      const yyyymmdd = data.dateOfBirth.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const ddmmyyyy = data.dateOfBirth.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);

      if (yyyymmdd && yyyymmdd[1] && yyyymmdd[2] && yyyymmdd[3]) {
        year = parseInt(yyyymmdd[1], 10);
        month = parseInt(yyyymmdd[2], 10) - 1;
        day = parseInt(yyyymmdd[3], 10);
      } else if (ddmmyyyy && ddmmyyyy[1] && ddmmyyyy[2] && ddmmyyyy[3]) {
        day = parseInt(ddmmyyyy[1], 10);
        month = parseInt(ddmmyyyy[2], 10) - 1;
        year = parseInt(ddmmyyyy[3], 10);
      } else {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date of Birth must be in DD/MM/YYYY or YYYY-MM-DD format",
          path: ["dateOfBirth"],
        });
        return;
      }

      const dobDate = new Date(year, month, day);

      if (
        dobDate.getFullYear() !== year ||
        dobDate.getMonth() !== month ||
        dobDate.getDate() !== day
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date of Birth is not a valid calendar date",
          path: ["dateOfBirth"],
        });
        return;
      }

      const now = new Date();
      if (dobDate > now) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date of Birth cannot be in the future",
          path: ["dateOfBirth"],
        });
        return;
      }

      let age = now.getFullYear() - year;
      const mDiff = now.getMonth() - month;
      if (mDiff < 0 || (mDiff === 0 && now.getDate() < day)) {
        age--;
      }

      if (age < 15) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Applicant must be at least 15 years old for card issuance",
          path: ["dateOfBirth"],
        });
      } else if (age > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid Date of Birth (age exceeds 100 years)",
          path: ["dateOfBirth"],
        });
      }
    }
  });

export const completeFullKycSchema = z
  .object({
    aadhaarNumber: z
      .string()
      .trim()
      .transform((val) => val.replace(/\s+/g, ""))
      .optional(),
    aadhaarOtp: z
      .string()
      .trim()
      .optional(),
    panNumber: z
      .string()
      .trim()
      .toUpperCase()
      .optional(),
    isMock: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (process.env.NODE_ENV === "production" && data.isMock) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mock KYC verification is strictly disabled in production.",
        path: ["isMock"],
      });
      return;
    }

    if (!data.isMock) {
      if (!data.aadhaarNumber || !/^[0-9]{12}$/.test(data.aadhaarNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Aadhaar number must be exactly 12 digits",
          path: ["aadhaarNumber"],
        });
      }
      if (!data.aadhaarOtp || data.aadhaarOtp.length < 4 || data.aadhaarOtp.length > 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Aadhaar OTP must be between 4 and 6 digits",
          path: ["aadhaarOtp"],
        });
      }
      if (!data.panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.panNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid PAN card format (e.g. ABCDE1234F)",
          path: ["panNumber"],
        });
      }
    }
  });

export const loadMoneySchema = z.object({
  amount: z
    .number({
      message: "Amount must be a valid number",
    })
    .min(100, "Minimum card load amount is ₹100.00")
    .max(200000, "Maximum card load amount cannot exceed ₹2,00,000.00")
    .refine(
      (val) => Number(val.toFixed(2)) === val,
      "Amount cannot have more than 2 decimal places"
    ),
  paymentMethod: z
    .string()
    .trim()
    .min(2, "Payment method is required")
    .default("Google Pay (UPI)"),
  upiId: z
    .string()
    .trim()
    .optional(),
  idempotencyKey: z
    .string()
    .trim()
    .max(128, "Idempotency key cannot exceed 128 characters")
    .optional(),
});

export type SendCardOtpInput = z.infer<typeof sendCardOtpSchema>;
export type RegisterAndIssueCardInput = z.infer<typeof registerAndIssueCardSchema>;
export type CompleteFullKycInput = z.infer<typeof completeFullKycSchema>;
export type LoadMoneyInput = z.infer<typeof loadMoneySchema>;

