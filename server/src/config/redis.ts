import { Redis } from "ioredis";
import { env } from "../env.config.js";

let redisClient: Redis | null = null;
let isConnected = false;

/**
 * Returns the singleton ioredis client instance.
 * If Redis is disabled via configuration, returns null.
 */
export function getRedisClient(): Redis | null {
  if (!env.REDIS_ENABLED) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      keyPrefix: env.REDIS_KEY_PREFIX,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        // Stop retrying quickly if in test mode
        if (env.NODE_ENV === "test" && times > 2) return null;
        return Math.min(times * 100, 2000);
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redisClient.on("connect", () => {
      isConnected = true;
      if (env.NODE_ENV !== "test") {
        console.log("⚡ [REDIS] Connected successfully to Redis Cache & Locks");
      }
    });

    redisClient.on("ready", () => {
      isConnected = true;
    });

    redisClient.on("error", (err: Error) => {
      isConnected = false;
      if (env.NODE_ENV !== "test") {
        console.warn("⚠️ [REDIS] Connection error:", err.message);
      }
    });

    redisClient.on("close", () => {
      isConnected = false;
    });
  }

  return redisClient;
}

/**
 * Explicitly connects to Redis during server startup.
 */
export async function connectRedis(): Promise<void> {
  if (!env.REDIS_ENABLED) {
    return;
  }

  try {
    const client = getRedisClient();
    if (client && client.status !== "ready" && client.status !== "connecting") {
      await client.connect();
      isConnected = true;
    }
  } catch (err: unknown) {
    isConnected = false;
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️ [REDIS] Failed initial connection to Redis (${msg}). Operating with graceful degradation.`);
  }
}

/**
 * Disconnects Redis during server shutdown or test teardown.
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      if (redisClient.status === "ready" || redisClient.status === "connecting") {
        await redisClient.quit();
      } else {
        redisClient.disconnect();
      }
    } catch {
      redisClient.disconnect();
    } finally {
      redisClient = null;
      isConnected = false;
    }
  }
}

/**
 * Returns current Redis connectivity status.
 */
export function isRedisConnected(): boolean {
  return env.REDIS_ENABLED && isConnected && redisClient?.status === "ready";
}
