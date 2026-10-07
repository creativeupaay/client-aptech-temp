import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .default("3000")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 65535, {
      message: "PORT must be a valid port number between 1 and 65535",
    }),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  MONGO_URI: z
    .string()
    .min(1, "MONGO_URI is required to connect to MongoDB"),
  CLIENT_URL: z
    .string()
    .default("http://localhost:5173"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(16, "JWT_ACCESS_SECRET must be at least 16 characters")
    .default("tbx_access_secret_key_super_secure_2026"),

  JWT_REFRESH_SECRET: z
    .string()
    .min(16, "JWT_REFRESH_SECRET must be at least 16 characters")
    .default("tbx_refresh_secret_key_super_secure_2026"),
  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .default("15m"),
  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .default("7d"),
  ENCRYPTION_KEY: z
    .string()
    .min(16, "ENCRYPTION_KEY must be at least 16 characters")
    .default(process.env.ENCRYPTION_KEY || "tbx_data_encryption_vault_key_2026"),

  OTP_EXPIRY_MINUTES: z
    .string()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "OTP_EXPIRY_MINUTES must be a positive number",
    }),
  SMS_PROVIDER: z
    .enum(["mock", "twilio", "gupshup"])
    .default("mock"),
  PROCONNECT_API_URL: z
    .string()
    .default("http://localhost:8000/api/v1/mock/proconnect"),
  PROCONNECT_CLIENT_ID: z
    .string()
    .default("tbx_aptech_client_2026"),
  PROCONNECT_CLIENT_SECRET: z
    .string()
    .default("tbx_aptech_secret_super_secure_2026"),
  PROCONNECT_PROVIDER: z
    .enum(["mock", "http"])
    .default("mock"),
  APTECH_COIN_API_URL: z
    .string()
    .default("http://localhost:5175/api/v1/coins"),
  APTECH_COIN_PROVIDER: z
    .enum(["mock", "http"])
    .default("http"),
  REDIS_URL: z
    .string()
    .default(process.env.REDIS_URL || "redis://127.0.0.1:6379"),
  REDIS_KEY_PREFIX: z
    .string()
    .default(process.env.REDIS_KEY_PREFIX || "aptech:"),
  REDIS_ENABLED: z
    .string()
    .default(process.env.REDIS_ENABLED || "true")
    .transform((val) => val === "true" || val === "1"),
  HUBBLE_CLIENT_ID: z
    .string()
    .default(process.env.HUBBLE_CLIENT_ID || "tbx-cards-loyalty-dev-sdk-fqlxyqb3"),
  HUBBLE_APP_SECRET: z
    .string()
    .default(process.env.HUBBLE_APP_SECRET || (process.env.NODE_ENV === "test" ? "mock_hubble_test_secret" : "")),
  HUBBLE_SDK_BASE_URL: z
    .string()
    .default("https://sdk.dev.myhubble.money"),
  HUBBLE_WEBHOOK_SECRET: z
    .string()
    .default("mock_hubble_secret_2026"),
  HUBBLE_MOCK_SSO: z
    .string()
    .default("true")
    .transform((val) => val === "true" || val === "1"),

  // TransBnk Banking Gateway Configuration
  TRANSBNK_BASE_URL: z
    .string()
    .url()
    .default(process.env.TRANSBNK_BASE_URL || "https://sandbox-api.trusthub.in"),
  TRANSBNK_API_KEY: z
    .string()
    .min(1)
    .default(process.env.TRANSBNK_API_KEY || "sandbox_api_key"),
  TRANSBNK_CLIENT_ID: z
    .string()
    .min(1)
    .default(process.env.TRANSBNK_CLIENT_ID || "sandbox_client_id"),
  TRANSBNK_USERNAME: z
    .string()
    .min(1)
    .default(process.env.TRANSBNK_USERNAME || "sandbox_username"),
  TRANSBNK_CLIENT_PASSWORD: z
    .string()
    .min(1)
    .default(process.env.TRANSBNK_CLIENT_PASSWORD || "sandbox_password"),
  TRANSBNK_PROVIDER: z
    .enum(["mock", "http"])
    .default((process.env.TRANSBNK_PROVIDER as "mock" | "http") || "mock"),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === "production" && data.TRANSBNK_PROVIDER === "http") {
    if (data.TRANSBNK_API_KEY === "sandbox_api_key") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["TRANSBNK_API_KEY"],
        message: "A real production TRANSBNK_API_KEY is required in production mode.",
      });
    }
    if (data.TRANSBNK_CLIENT_ID === "sandbox_client_id") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["TRANSBNK_CLIENT_ID"],
        message: "A real production TRANSBNK_CLIENT_ID is required in production mode.",
      });
    }
    if (data.TRANSBNK_USERNAME === "sandbox_username") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["TRANSBNK_USERNAME"],
        message: "A real production TRANSBNK_USERNAME is required in production mode.",
      });
    }
    if (data.TRANSBNK_CLIENT_PASSWORD === "sandbox_password") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["TRANSBNK_CLIENT_PASSWORD"],
        message: "A real production TRANSBNK_CLIENT_PASSWORD is required in production mode.",
      });
    }
  }
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables configuration:");
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = Object.freeze(parsedEnv.data);
export type Env = z.infer<typeof envSchema>;
