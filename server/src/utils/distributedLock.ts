import crypto from "crypto";
import { getRedisClient, isRedisConnected } from "../config/redis.js";
import { ApiError } from "./ApiError.js";
import { env } from "../env.config.js";

/**
 * Lua script that atomically verifies ownership before releasing the lock.
 * This guarantees a process cannot inadvertently delete another process's lock
 * if execution exceeded the TTL.
 */
const UNLOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`;

export interface LockOptions {
  ttlMs?: number;
  customErrorMessage?: string;
}

/**
 * Executes a critical async task within a Redis-backed distributed lock.
 * Prevents race conditions, double-spending, and concurrent mutation.
 *
 * @param lockKey Unique domain key (e.g. `debit:student_123` or `load:card_456`)
 * @param task The async operation to execute atomically
 * @param options Lock options (ttlMs defaults to 5000ms)
 */
export async function withDistributedLock<T>(
  lockKey: string,
  task: () => Promise<T>,
  options: LockOptions = {}
): Promise<T> {
  const ttlMs = options.ttlMs ?? 5000;
  const redis = getRedisClient();

  // If Redis is not available, fail-closed in production to preserve concurrency integrity
  if (!redis || !isRedisConnected()) {
    const isProduction = env.NODE_ENV === "production" || process.env.NODE_ENV === "production";
    if (isProduction) {
      throw ApiError.serviceUnavailable(
        "Distributed lock provider is temporarily unavailable. Transaction aborted to prevent concurrency conflicts."
      );
    }
    return await task();
  }

  const lockToken = crypto.randomUUID();
  const key = `lock:${lockKey}`;

  let acquired = false;
  try {
    const res = await redis.set(key, lockToken, "PX", ttlMs, "NX");
    acquired = res === "OK";
  } catch (err) {
    if (process.env.NODE_ENV === "test") {
      console.warn(`⚠️ [REDIS LOCK] Error checking lock for ${key}:`, err);
      return await task();
    }
    throw ApiError.serviceUnavailable(
      "Unable to acquire transaction lock. Please retry."
    );
  }

  if (!acquired) {
    throw ApiError.conflict(
      options.customErrorMessage ||
        "A concurrent operation is already in progress for this resource. Please retry shortly."
    );
  }

  try {
    return await task();
  } finally {
    try {
      await redis.eval(UNLOCK_SCRIPT, 1, key, lockToken);
    } catch (err) {
      console.warn(`⚠️ [REDIS LOCK] Error releasing lock for ${key}:`, err);
    }
  }
}
