import { rateLimit, type Options } from "express-rate-limit";
import { type Request, type Response } from "express";
import { type AuthenticatedRequest } from "./auth.middleware.js";

/**
 * Factory helper for creating clean in-memory rate limiters (No Redis required).
 * Uses express-rate-limit's built-in MemoryStore with automatic key expiry.
 */
export function createInMemoryLimiter(options: Partial<Options> & { message?: string }) {
  return rateLimit({
    windowMs: options.windowMs || 60 * 1000, // Default 1 minute
    limit: options.limit || 30, // Default 30 requests per window
    standardHeaders: "draft-7", // Return standard RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    skip: (req) => {
      // In automated tests, skip rate limiting unless specifically testing it
      if (process.env.NODE_ENV === "test" && !req.headers["x-test-rate-limit"]) {
        return true;
      }
      return false;
    },
    keyGenerator: (req: Request) => {
      // Prefer authenticated student/user ID over IP to prevent multi-device bypass
      const authReq = req as AuthenticatedRequest;
      if (authReq.user?.id) {
        return `user_${authReq.user.id}`;
      }
      return req.ip || req.socket.remoteAddress || "anonymous";
    },
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        status: "ERROR",
        success: false,
        statusCode: 429,
        message: options.message || "Too many requests. Please slow down and try again shortly.",
      });
    },
    ...options,
  });
}

/**
 * 1. Hubble Launch URL Limiter:
 * Protects POST /api/v1/hubble/launch-url
 * Max 10 requests per minute per authenticated student.
 */
export const hubbleLaunchLimiter = createInMemoryLimiter({
  windowMs: 60 * 1000,
  limit: 10,
  message: "Too many voucher store access requests. Please wait a minute before trying again.",
});

/**
 * 2. Hubble History & Points Polling Limiter:
 * Protects GET /api/v1/hubble/history
 * Max 30 requests per minute per student (plenty of headroom for 15s polling, prevents aggressive spam).
 */
export const hubbleHistoryLimiter = createInMemoryLimiter({
  windowMs: 60 * 1000,
  limit: 30,
  message: "Too many balance check requests. Please slow down.",
});

/**
 * 3. Hubble Cloud Callback Limiter:
 * Protects /api/v1/hubble/balance, /debit, /reverse, /sso
 * Max 120 requests per minute per IP / Hubble client.
 */
export const hubbleCallbackLimiter = createInMemoryLimiter({
  windowMs: 60 * 1000,
  limit: 120,
  keyGenerator: (req) => req.ip || "hubble_cloud",
  message: "Hubble integration rate limit exceeded. Please retry after a brief pause.",
});

/**
 * 4. SSO Simulation Limiter:
 * Protects POST /api/v1/auth/sso/simulate-code
 * Max 15 requests per minute per IP.
 */
export const ssoSimulateLimiter = createInMemoryLimiter({
  windowMs: 60 * 1000,
  limit: 15,
  message: "Too many SSO simulation requests. Please slow down.",
});
