import rateLimit, { type RateLimitRequestHandler, type Options } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import type { Request, Response } from "express";
import { getRedisClient, isRedisConnected } from "../config/redis.js";
import { env } from "../env.config.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";

export interface RateLimiterConfig {
  windowMs: number;
  max?: number;
  limit?: number;
  message: string;
  prefix: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * Creates a rate limiter backed by Redis with graceful in-memory fallback.
 */
export function createRateLimiter(options: RateLimiterConfig): RateLimitRequestHandler {
  const redis = getRedisClient();
  const limitValue = options.max || options.limit || 30;

  const store =
    redis && isRedisConnected()
      ? new RedisStore({
          // @ts-expect-error RedisStore type mapping for ioredis call method
          sendCommand: (...args: string[]) => redis.call(...args),
          prefix: `rl:${options.prefix}:`,
        })
      : undefined;

  return rateLimit({
    windowMs: options.windowMs,
    limit: limitValue,
    standardHeaders: "draft-7",
    legacyHeaders: true,
    passOnStoreError: true,
    validate: { keyGeneratorIpFallback: false },
    store,
    skip: (req) => {
      // In automated tests, skip rate limiting unless specifically requested via header
      if (env.NODE_ENV === "test" && !req.headers["x-test-rate-limit"]) {
        return true;
      }
      return req.method === "OPTIONS";
    },
    keyGenerator:
      options.keyGenerator ||
      ((req: Request) => {
        const authReq = req as AuthenticatedRequest;
        if (authReq.user?.id) {
          return `user_${authReq.user.id}`;
        }
        return req.ip || req.socket.remoteAddress || "anonymous";
      }),
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        status: "ERROR",
        success: false,
        statusCode: 429,
        message: options.message,
      });
    },
  });
}

/**
 * Strict rate limiter for Student Login attempts (5 attempts per 15 minutes).
 * Protects against credential stuffing and brute-force attacks.
 */
export const authLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please try again after 15 minutes.",
  prefix: "auth_login",
  keyGenerator: (req) => {
    const id = req.body?.identifier || req.body?.mobile || req.body?.email;
    if (id && typeof id === "string") {
      return `auth_login_${id.trim().toLowerCase()}`;
    }
    return req.ip || req.socket.remoteAddress || "anonymous";
  },
});

/**
 * Rate limiter for Signup registration (10 signups per 15 minutes).
 * Protects against spam account generation.
 */
export const authSignupLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many registration attempts. Please wait before creating another account.",
  prefix: "auth_signup",
  keyGenerator: (req) => {
    const mob = req.body?.mobile;
    if (mob && typeof mob === "string") {
      return `auth_signup_${mob.replace(/\D/g, "")}`;
    }
    return req.ip || req.socket.remoteAddress || "anonymous";
  },
});

/**
 * Strict SMS / OTP rate limiter (5 OTP requests per 10 minutes).
 * Shields SMS gateway budget against automated flooding.
 */
export const sendOtpLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many card verification OTP requests. Please wait 10 minutes before retrying.",
  prefix: "sms_otp",
  keyGenerator: (req) => {
    const mobile = req.body?.mobile;
    if (mobile && typeof mobile === "string") {
      return `card_otp_mob_${mobile.replace(/\D/g, "")}`;
    }
    return req.ip || req.socket.remoteAddress || "anonymous";
  },
});

/**
 * IP-level limiter for Card OTP requests (20 requests per 10 minutes).
 */
export const cardOtpIpLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "Too many card verification requests from this IP address. Please wait 10 minutes before retrying.",
  prefix: "card_otp_global_ip",
  keyGenerator: (req) => `card_otp_global_ip_${req.ip || req.socket.remoteAddress || "anonymous"}`,
});

/**
 * Mobile-level limiter for Card OTP requests (5 requests per 10 minutes).
 */
export const cardOtpLimiter = sendOtpLimiter;

/**
 * Card register-and-issue abuse protection (10 requests per 10 minutes per user/IP).
 */
export const cardIssueLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many card issuance attempts. Please wait 10 minutes before retrying.",
  prefix: "card_issue",
  keyGenerator: (req) => {
    const userId = (req as { user?: { id?: string } }).user?.id;
    if (userId) return `card_issue_user_${userId}`;
    return `card_issue_ip_${req.ip || req.socket.remoteAddress || "anonymous"}`;
  },
});

/**
 * Limiter for Hubble Store launch requests (10 requests per minute).
 */
export const hubbleLaunchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many voucher store access requests. Please wait a minute before trying again.",
  prefix: "hbl_launch",
});

/**
 * Limiter for Hubble history polling (30 requests per minute).
 */
export const hubbleHistoryLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many balance check requests. Please slow down.",
  prefix: "hbl_hist",
});

/**
 * Limiter for Hubble Cloud reverse callbacks (1200 requests per minute).
 */
export const hubbleCallbackLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 1200,
  message: "Hubble integration rate limit exceeded. Please retry after a brief pause.",
  prefix: "hbl_callback",
  keyGenerator: (req) => {
    const hasSecret = req.headers["x-hubble-secret"] || req.headers["x-hubblesecret"];
    if (hasSecret) {
      return "partner_hubble_cloud";
    }
    return `unauth_ip_${req.ip || req.socket.remoteAddress || "anonymous"}`;
  },
});

/**
 * Limiter for SSO Token Exchange (10 requests per minute).
 * Prevents brute-forcing short-lived single-use authorization codes.
 */
export const ssoExchangeLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many SSO token exchange attempts. Please try again in a minute.",
  prefix: "sso_exchange",
});

/**
 * Limiter for SSO simulation helper endpoint (15 requests per minute).
 */
export const ssoSimulateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: "Too many SSO simulation requests. Please slow down.",
  prefix: "sso_sim",
});

/**
 * General public API rate limiter (200 requests per minute).
 */
export const globalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 200,
  message: "API rate limit exceeded. Please throttle your requests.",
  prefix: "global_api",
});
