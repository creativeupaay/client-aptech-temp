import { z } from "zod";

export const ssoExchangeSchema = z
  .object({
    token: z.string({ error: "Token is required" }).min(1, "Token is required"),
  })
  .passthrough();

export const balanceQuerySchema = z
  .object({
    userId: z.string().nullable().optional(),
    studentId: z.string().nullable().optional(),
    token: z.string().nullable().optional(),
  })
  .passthrough();

export const debitCoinsSchema = z
  .object({
    userId: z.string().nullable().optional(),
    studentId: z.string().nullable().optional(),
    token: z.string().nullable().optional(),
    amount: z.coerce.number().positive().nullable().optional(),
    coins: z.coerce.number().positive().nullable().optional(),
    transactionId: z.string().nullable().optional(),
    referenceId: z.string().nullable().optional(),
    orderId: z.string().nullable().optional(),
    orderRef: z.string().nullable().optional(),
    brandName: z.string().nullable().optional(),
    brandId: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
  })
  .passthrough();

export const reverseDebitSchema = z
  .object({
    transactionId: z.string().nullable().optional(),
    originalTransactionId: z.string().nullable().optional(),
    referenceId: z.string().nullable().optional(),
    userId: z.string().nullable().optional(),
    studentId: z.string().nullable().optional(),
    amount: z.coerce.number().positive().nullable().optional(),
    coins: z.coerce.number().positive().nullable().optional(),
    reason: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
  })
  .passthrough();

export const webhookTransactionSchema = z
  .object({
    orderId: z.string(),
    userId: z.string().nullable().optional(),
    studentId: z.string().nullable().optional(),
    brandName: z.string().nullable().optional().default("Brand Gift Card"),
    voucherCode: z.string().nullable().optional(),
    pin: z.string().nullable().optional(),
    denomination: z.coerce.number().positive().nullable().optional().default(100),
    pointsDebited: z.coerce.number().positive().nullable().optional().default(100),
    expiryDate: z.string().nullable().optional(),
    redemptionUrl: z.string().nullable().optional(),
    status: z.enum(["ACTIVE", "USED", "EXPIRED", "CANCELLED"]).nullable().optional().default("ACTIVE"),
    transactionId: z.string().nullable().optional(),
  })
  .passthrough();

export type SsoExchangeInput = z.infer<typeof ssoExchangeSchema>;
export type BalanceQueryInput = z.infer<typeof balanceQuerySchema>;
export type DebitCoinsInput = z.infer<typeof debitCoinsSchema>;
export type ReverseDebitInput = z.infer<typeof reverseDebitSchema>;
export type WebhookTransactionInput = z.infer<typeof webhookTransactionSchema>;
