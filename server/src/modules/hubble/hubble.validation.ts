import { z } from "zod";

export const ssoExchangeSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const balanceQuerySchema = z.object({
  userId: z.string().optional(),
  studentId: z.string().optional(),
  token: z.string().optional(),
});

export const debitCoinsSchema = z.object({
  userId: z.string().optional(),
  studentId: z.string().optional(),
  token: z.string().optional(),
  amount: z.coerce.number().positive().optional(),
  coins: z.coerce.number().positive().optional(),
  transactionId: z.string().optional(),
  referenceId: z.string().optional(),
  orderId: z.string().optional(),
  orderRef: z.string().optional(),
  brandName: z.string().optional(),
  brandId: z.string().optional(),
  note: z.string().optional(),
});

export const reverseDebitSchema = z.object({
  transactionId: z.string().optional(),
  originalTransactionId: z.string().optional(),
  referenceId: z.string().optional(),
  userId: z.string().optional(),
  studentId: z.string().optional(),
  amount: z.coerce.number().positive().optional(),
  coins: z.coerce.number().positive().optional(),
  reason: z.string().optional(),
  note: z.string().optional(),
});

export const webhookTransactionSchema = z.object({
  orderId: z.string(),
  userId: z.string().optional(),
  studentId: z.string().optional(),
  brandName: z.string().default("Brand Gift Card"),
  voucherCode: z.string().optional(),
  pin: z.string().optional(),
  denomination: z.coerce.number().positive().default(100),
  pointsDebited: z.coerce.number().positive().default(100),
  expiryDate: z.string().optional(),
  redemptionUrl: z.string().optional(),
  status: z.enum(["ACTIVE", "USED", "EXPIRED", "CANCELLED"]).default("ACTIVE"),
  transactionId: z.string().optional(),
});

export type SsoExchangeInput = z.infer<typeof ssoExchangeSchema>;
export type BalanceQueryInput = z.infer<typeof balanceQuerySchema>;
export type DebitCoinsInput = z.infer<typeof debitCoinsSchema>;
export type ReverseDebitInput = z.infer<typeof reverseDebitSchema>;
export type WebhookTransactionInput = z.infer<typeof webhookTransactionSchema>;
