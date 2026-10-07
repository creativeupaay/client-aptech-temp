import { getRedisClient, isRedisConnected } from "../config/redis.js";
import { env } from "../env.config.js";

/**
 * Reusable Cache Service powered by Redis with in-memory serialization
 * and safe fail-open fallback if Redis is down.
 */
export class CacheService {
  private static formatKey(key: string): string {
    return `cache:${key}`;
  }

  /**
   * Retrieves a cached item by key. Returns null if expired or missing.
   */
  public static async get<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    if (!redis || !isRedisConnected()) {
      return null;
    }

    try {
      const raw = await redis.get(this.formatKey(key));
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`⚠️ [CACHE] Error reading key ${key}:`, err);
      return null;
    }
  }

  /**
   * Stores an item in cache with a defined TTL in seconds.
   */
  public static async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const redis = getRedisClient();
    if (!redis || !isRedisConnected()) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      await redis.set(this.formatKey(key), serialized, "EX", ttlSeconds);
    } catch (err) {
      console.warn(`⚠️ [CACHE] Error writing key ${key}:`, err);
    }
  }

  /**
   * Evicts a key from cache.
   */
  public static async del(key: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis || !isRedisConnected()) {
      return;
    }

    try {
      await redis.del(this.formatKey(key));
    } catch (err) {
      console.warn(`⚠️ [CACHE] Error deleting key ${key}:`, err);
    }
  }

  /**
   * Evicts multiple keys matching a pattern.
   * Strips prefix from scanned keys before deletion to prevent double-prefixing.
   */
  public static async delPattern(pattern: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis || !isRedisConnected()) {
      return;
    }

    return new Promise<void>((resolve) => {
      try {
        const stream = redis.scanStream({
          match: `*cache:${pattern}*`,
          count: 50,
        });

        const prefix = env.REDIS_KEY_PREFIX || "";

        stream.on("data", async (keys: string[]) => {
          if (keys.length) {
            stream.pause();
            const pipeline = redis.pipeline();
            for (const rawKey of keys) {
              const strippedKey = prefix && rawKey.startsWith(prefix)
                ? rawKey.slice(prefix.length)
                : rawKey;
              pipeline.del(strippedKey);
            }
            await pipeline.exec().catch(() => {});
            stream.resume();
          }
        });

        stream.on("end", () => resolve());
        stream.on("error", (err) => {
          console.warn(`⚠️ [CACHE] Error scanning pattern ${pattern}:`, err);
          resolve();
        });
      } catch (err) {
        console.warn(`⚠️ [CACHE] Error executing delPattern ${pattern}:`, err);
        resolve();
      }
    });
  }
}
