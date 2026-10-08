import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { getRedisClient, connectRedis } from "../src/config/redis.js";
import { withDistributedLock } from "../src/utils/distributedLock.js";
import { CacheService } from "../src/utils/cache.js";
import { HttpAptechCoinProvider } from "../src/services/aptech-coins/providers/http.provider.js";
import { MockAptechCoinProvider } from "../src/services/aptech-coins/providers/mock.provider.js";
import { HubbleService } from "../src/modules/hubble/hubble.service.js";
import { CardService } from "../src/modules/card/card.service.js";
import { User } from "../src/modules/user/user.model.js";
import { Card } from "../src/modules/card/card.model.js";

describe("Redis End-to-End Capabilities (Distributed Locks, Caching & Rate Limiting)", () => {
  beforeAll(async () => {
    await connectRedis();
  });

  afterAll(async () => {
    const redis = getRedisClient();
    if (redis) {
      // Clean up test keys with prefix
      const keys = await redis.keys("aptech:*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  });

  // ==========================================================================
  // Item 1: Distributed Atomic Locks
  // ==========================================================================
  describe("Item 1: Distributed Atomic Locks (withDistributedLock)", () => {
    it("should execute task, release lock, and allow subsequent tasks on the same key", async () => {
      const lockKey = "unit:basic-lock-test";
      let executionCount = 0;

      const result1 = await withDistributedLock(lockKey, async () => {
        executionCount++;
        return "result_one";
      });

      expect(result1).toBe("result_one");
      expect(executionCount).toBe(1);

      // Lock must be released in Redis now
      const redis = getRedisClient();
      if (redis) {
        const lockVal = await redis.get(`aptech:lock:${lockKey}`);
        expect(lockVal).toBeNull();
      }

      // Next task with the same key should succeed immediately
      const result2 = await withDistributedLock(lockKey, async () => {
        executionCount++;
        return "result_two";
      });

      expect(result2).toBe("result_two");
      expect(executionCount).toBe(2);
    });

    it("should reject concurrent contention on the same lock key with 409 Conflict", async () => {
      const lockKey = "unit:concurrency-race";
      let task1Started = false;
      let task2Error: any = null;

      const promise1 = withDistributedLock(
        lockKey,
        async () => {
          task1Started = true;
          // Hold the lock for 150ms
          await new Promise((resolve) => setTimeout(resolve, 150));
          return "done_1";
        },
        { ttlMs: 3000 }
      );

      // Wait briefly until task 1 has acquired the lock
      await new Promise((resolve) => setTimeout(resolve, 30));
      expect(task1Started).toBe(true);

      // Task 2 attempts to acquire the lock concurrently
      try {
        await withDistributedLock(
          lockKey,
          async () => {
            return "done_2";
          },
          { ttlMs: 3000 }
        );
      } catch (err) {
        task2Error = err;
      }

      const res1 = await promise1;
      expect(res1).toBe("done_1");
      expect(task2Error).not.toBeNull();
      expect(task2Error.statusCode).toBe(409);
      expect(task2Error.message).toContain("concurrent operation");
    });

    it("should protect Hubble coin debit from concurrent double-spending via distributed locks", async () => {
      const studentId = "APT-REDIS-LOCK-01";
      MockAptechCoinProvider.getInstance().reset({
        [studentId]: 500,
      });

      const user = await User.create({
        name: "Lock Student",
        email: "lock@example.com",
        mobile: "9111122221",
        studentId,
        userType: "aptech_student",
      });

      // Hook mock provider to add a slight delay simulating network transit
      const originalDebit = MockAptechCoinProvider.getInstance().debitCoins;
      MockAptechCoinProvider.getInstance().debitCoins = async function (input) {
        await new Promise((r) => setTimeout(r, 80));
        return originalDebit.call(this, input);
      };

      try {
        // Launch two concurrent debits for the same student
        const debits = [
          HubbleService.debitCoins({
            userId: user._id.toString(),
            studentId,
            amount: 50,
            orderId: "ORDER_LOCK_01",
            brandName: "Swiggy",
          }),
          HubbleService.debitCoins({
            userId: user._id.toString(),
            studentId,
            amount: 50,
            orderId: "ORDER_LOCK_02",
            brandName: "Zomato",
          }),
        ];

        const results = await Promise.allSettled(debits);
        const fulfilled = results.filter((r) => r.status === "fulfilled");
        const rejected = results.filter((r) => r.status === "rejected");

        expect(fulfilled.length).toBe(1);
        expect(rejected.length).toBe(1);
        const error = (rejected[0] as PromiseRejectedResult).reason;
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Transaction currently in progress");
      } finally {
        MockAptechCoinProvider.getInstance().debitCoins = originalDebit;
      }
    });
  });

  // ==========================================================================
  // Item 4: Read Caching & Smart Invalidation
  // ==========================================================================
  describe("Item 4: Read Caching & Smart Invalidation (CacheService)", () => {
    it("should set, get, and delete cached values in Redis", async () => {
      const cacheKey = "test:user:profile";
      const sampleData = { id: 101, name: "Redis Test", balance: 1250 };

      // Set key with 60s TTL
      await CacheService.set(cacheKey, sampleData, 60);

      // Retrieve key
      const cached = await CacheService.get<typeof sampleData>(cacheKey);
      expect(cached).toEqual(sampleData);

      // Delete key
      await CacheService.del(cacheKey);

      // Verify key is gone
      const deleted = await CacheService.get<typeof sampleData>(cacheKey);
      expect(deleted).toBeNull();
    });

    it("should pattern-evict matching keys in Redis with prefix handling", async () => {
      await CacheService.set("bulk:item:1", { a: 1 }, 60);
      await CacheService.set("bulk:item:2", { a: 2 }, 60);
      await CacheService.set("other:item:3", { a: 3 }, 60);

      expect(await CacheService.get("bulk:item:1")).not.toBeNull();
      expect(await CacheService.get("bulk:item:2")).not.toBeNull();
      expect(await CacheService.get("other:item:3")).not.toBeNull();

      // Evict pattern
      await CacheService.delPattern("bulk:item");

      expect(await CacheService.get("bulk:item:1")).toBeNull();
      expect(await CacheService.get("bulk:item:2")).toBeNull();
      expect(await CacheService.get("other:item:3")).not.toBeNull();
    });

    it("should cache Aptech coin balance and invalidate immediately on debit", async () => {
      const provider = new HttpAptechCoinProvider();
      const studentId = "APT-CACHE-TEST-01";
      const cacheKey = `coins:balance:${studentId}`;

      // Mock the global fetch for testing HttpAptechCoinProvider
      const originalFetch = global.fetch;
      let fetchCallCount = 0;

      global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        fetchCallCount++;
        const urlStr = input.toString();

        if (urlStr.includes("/balance")) {
          return new Response(
            JSON.stringify({
              success: true,
              data: { studentId, balance: 800, currency: "POINTS" },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        if (urlStr.includes("/debit")) {
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                studentId,
                transactionId: "TXN_CACHE_DEBIT_01",
                debitedAmount: 100,
                remainingBalance: 700,
                currency: "POINTS",
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        return originalFetch(input, init);
      };

      try {
        // Ensure clean cache state
        await CacheService.del(cacheKey);

        // 1st getBalance: calls fetch and caches result
        const res1 = await provider.getBalance(studentId);
        expect(res1.balance).toBe(800);
        expect(fetchCallCount).toBe(1);

        // 2nd getBalance: should hit Redis cache (fetch count remains 1!)
        const res2 = await provider.getBalance(studentId);
        expect(res2.balance).toBe(800);
        expect(fetchCallCount).toBe(1);

        // Verify key is in Redis
        const cachedInRedis = await CacheService.get<{ balance: number }>(cacheKey);
        expect(cachedInRedis?.balance).toBe(800);

        // 3rd: debitCoins executes and MUST invalidate the cache
        await provider.debitCoins({
          studentId,
          amount: 100,
          transactionId: "TXN_CACHE_DEBIT_01",
        });

        // Verify cache key was evicted
        const cacheAfterDebit = await CacheService.get(cacheKey);
        expect(cacheAfterDebit).toBeNull();

        // 4th getBalance: calls fetch again (fetch count increments to 3: balance + debit + balance)
        const res3 = await provider.getBalance(studentId);
        expect(res3.balance).toBe(800);
        expect(fetchCallCount).toBe(3);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it("should throttle fast repeated card status polling within 2-second buffer window", async () => {
      const user = await User.create({
        name: "Poll Student",
        email: "poll@example.com",
        mobile: "9444433331",
        userType: "aptech_student",
      });

      const card = await Card.create({
        userId: user._id,
        referenceId: "TB_REF_POLL_TEST_01",
        senderTag: "TB_TAG_01",
        status: "APPLICATION_PENDING",
        maskedPan: "•••• •••• •••• 1234",
        totalLimit: 10000,
        availableBalance: 0,
      });

      // 1st poll sets 2s throttle key
      await CardService.pollCardStatus(user._id);

      // Verify Redis throttle buffer exists
      const isThrottled = await CacheService.get<boolean>(`tb:poll:${card.referenceId}`);
      expect(isThrottled).toBe(true);
    });
  });

  // ==========================================================================
  // Item 5: Distributed API Rate Limiting & Security
  // ==========================================================================
  describe("Item 5: Distributed API Rate Limiting (RedisStore)", () => {
    it("should include standard rate limit headers when x-test-rate-limit is enabled", async () => {
      const res = await request(app)
        .post("/api/v1/card/send-otp")
        .set("x-test-rate-limit", "true")
        .send({ mobile: "9876500001" });

      const hasRateLimitHeader =
        "x-ratelimit-limit" in res.headers ||
        "ratelimit" in res.headers ||
        "ratelimit-limit" in res.headers;

      expect(hasRateLimitHeader).toBe(true);
    });

    it("should enforce card OTP rate limiting and return 429 after exceeding max requests", async () => {
      const testMobile = "9876599999";

      // Card OTP limit is 5 requests per 10 minutes per mobile
      // Fire 5 requests
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post("/api/v1/card/send-otp")
          .set("x-test-rate-limit", "true")
          .send({ mobile: testMobile });

        expect(res.status).toBe(200);
      }

      // 6th request must be rate limited with HTTP 429
      const throttledRes = await request(app)
        .post("/api/v1/card/send-otp")
        .set("x-test-rate-limit", "true")
        .send({ mobile: testMobile });

      expect(throttledRes.status).toBe(429);
      expect(throttledRes.body.success).toBe(false);
      expect(throttledRes.body.message).toContain("Too many card verification OTP requests");
    });

    it("should enforce SSO exchange rate limiting and return 429 after 10 requests", async () => {
      // SSO exchange limit is 10 requests per minute
      // Fire 10 requests with invalid codes
      for (let i = 0; i < 10; i++) {
        const res = await request(app)
          .post("/api/v1/auth/sso/exchange")
          .set("x-test-rate-limit", "true")
          .send({ code: `INVALID_CODE_${i}` });

        // Expected 400 because code is invalid
        expect(res.status).toBe(400);
      }

      // 11th request must be blocked by Redis rate limiter with HTTP 429
      const throttledRes = await request(app)
        .post("/api/v1/auth/sso/exchange")
        .set("x-test-rate-limit", "true")
        .send({ code: "BLOCKED_CODE" });

      expect(throttledRes.status).toBe(429);
      expect(throttledRes.body.success).toBe(false);
      expect(throttledRes.body.message).toContain("Too many SSO token exchange attempts");
    });
  });
});
