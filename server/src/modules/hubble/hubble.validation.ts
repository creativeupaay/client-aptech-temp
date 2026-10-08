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

export const webhookVoucherItemSchema = z
  .object({
    id: z.string().nullable().optional(),
    cardType: z.string().nullable().optional(),
    cardPin: z.string().nullable().optional(),
    cardNumber: z.string().nullable().optional(),
    voucherCode: z.string().nullable().optional(),
    pin: z.string().nullable().optional(),
    validTill: z.string().nullable().optional(),
    expiryDate: z.string().nullable().optional(),
    shareImageUrl: z.string().nullable().optional(),
    redemptionUrl: z.string().nullable().optional(),
    amount: z.coerce.number().nullable().optional(),
    brandId: z.string().nullable().optional(),
    brandName: z.string().nullable().optional(),
    brandRetailModes: z.array(z.string()).nullable().optional(),
  })
  .passthrough();

export const webhookTransactionSchema = z
  .object({
    orderId: z.string().nullable().optional(),
    transactionReferenceId: z.string().nullable().optional(),
    partnerCoinTransactionId: z.string().nullable().optional(),
    partnerCoinReversalTransactionId: z.string().nullable().optional(),
    partnerCoinsDebited: z.coerce.number().nullable().optional(),
    orderStatus: z.string().nullable().optional(),
    userId: z.string().nullable().optional(),
    studentId: z.string().nullable().optional(),
    brandName: z.string().nullable().optional().default("Brand Gift Card"),
    voucherCode: z.string().nullable().optional(),
    pin: z.string().nullable().optional(),
    denomination: z.coerce.number().positive().nullable().optional(),
    amount: z.coerce.number().positive().nullable().optional(),
    discountAmount: z.coerce.number().nullable().optional(),
    coinAmount: z.coerce.number().nullable().optional(),
    pointsDebited: z.coerce.number().positive().nullable().optional(),
    expiryDate: z.string().nullable().optional(),
    redemptionUrl: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    transactionId: z.string().nullable().optional(),
    timestamp: z.string().nullable().optional(),
    vouchers: z.array(webhookVoucherItemSchema).nullable().optional(),
  })
  .passthrough();

export type SsoExchangeInput = z.infer<typeof ssoExchangeSchema>;
export type BalanceQueryInput = z.infer<typeof balanceQuerySchema>;
export type DebitCoinsInput = z.infer<typeof debitCoinsSchema>;
export type ReverseDebitInput = z.infer<typeof reverseDebitSchema>;
export type WebhookTransactionInput = z.infer<typeof webhookTransactionSchema>;
