import { z } from "zod";

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

export const ssoExchangeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Authorization code is required"),
});

export const simulateSsoCodeSchema = z.object({
  studentId: z.string().trim().optional(),
  name: z.string().trim().optional(),
  mobile: z.string().trim().optional(),
  email: z.string().trim().optional(),
});

export type SsoExchangeInput = z.infer<typeof ssoExchangeSchema>;
export type SimulateSsoCodeInput = z.infer<typeof simulateSsoCodeSchema>;
