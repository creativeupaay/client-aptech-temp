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
  HUBBLE_CLIENT_ID: z
    .string()
    .default("tbx-cards-loyalty-dev-sdk-fqlxyqb3"),
  HUBBLE_APP_SECRET: z
    .string()
    .default("R2ZHfNYjggU31wkDQ0L8haQKE1yvUz0G6md30FNKsRPsi4lWZNf3e41yRKbDGgWC"),
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
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables configuration:");
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = Object.freeze(parsedEnv.data);
export type Env = z.infer<typeof envSchema>;
