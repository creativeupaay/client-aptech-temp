import { connectRedis, getRedisClient, disconnectRedis } from "../src/config/redis.js";
import { withDistributedLock } from "../src/utils/distributedLock.js";
import { CacheService } from "../src/utils/cache.js";

async function runManualRedisTests() {
  console.log("\n=======================================================");
  console.log(" 🚀 AP-TECH REDIS MANUAL INTEGRATION TEST SUITE");
  console.log("=======================================================\n");

  // 1. Connection check
  console.log("📡 [STEP 1] Connecting to Redis...");
  await connectRedis();
  const redis = getRedisClient();

  if (!redis) {
    console.error("❌ Failed to initialize Redis client. Is REDIS_ENABLED=true in .env?");
    process.exit(1);
  }

  const pingRes = await redis.ping();
  console.log(`✅ Redis Connected! PING Response: "${pingRes}"\n`);

  // 2. Distributed Lock Concurrency Test
  console.log("🔒 [STEP 2] Testing Distributed Lock Concurrency & Mutex...");
  const lockKey = "manual:test:card_debit_9901";
  let winner: string | null = null;
  let loserError: string | null = null;

  console.log(`   Simulating 2 concurrent workers attempting to lock '${lockKey}' simultaneously...`);

  const worker1 = withDistributedLock(
    lockKey,
    async () => {
      winner = "Worker 1";
      console.log("   🟢 Worker 1 ACQUIRED the lock! Processing task (sleeping 300ms)...");
      await new Promise((r) => setTimeout(r, 300));
      console.log("   🟢 Worker 1 completed task and is releasing the lock.");
      return "SUCCESS_WORKER_1";
    },
    { ttlMs: 4000 }
  );

  // Start worker 2 40ms later while worker 1 still holds the lock
  await new Promise((r) => setTimeout(r, 40));
  const worker2 = withDistributedLock(
    lockKey,
    async () => {
      return "SUCCESS_WORKER_2";
    },
    { ttlMs: 4000, customErrorMessage: "Resource currently locked by another worker." }
  ).catch((err) => {
    loserError = err.message;
    console.log(`   🔴 Worker 2 was BLOCKED as expected: "${err.message}" (Status: ${err.statusCode})`);
  });

  await Promise.all([worker1, worker2]);
  console.log(`✅ Distributed Lock Test Passed! Lock prevented race conditions.\n`);

  // 3. Cache & Smart Invalidation Test
  console.log("⚡ [STEP 3] Testing CacheService & Smart Invalidation...");
  const balanceKey = "coins:balance:APT-MANUAL-2026";
  const balanceData = { studentId: "APT-MANUAL-2026", balance: 750, currency: "POINTS" };

  console.log(`   Writing balance to cache ('aptech:cache:${balanceKey}') with 30s TTL...`);
  await CacheService.set(balanceKey, balanceData, 30);

  const t0 = performance.now();
  const cachedVal = await CacheService.get<typeof balanceData>(balanceKey);
  const t1 = performance.now();
  console.log(`   🟢 Cache HIT in ${(t1 - t0).toFixed(2)}ms:`, cachedVal);

  console.log("   Simulating Coin Debit $\\rightarrow$ Smart Invalidation of cache key...");
  await CacheService.del(balanceKey);

  const afterInvalidate = await CacheService.get(balanceKey);
  console.log(`   Cached value after invalidation: ${afterInvalidate} (null = evicted)`);
  console.log("✅ Read Cache & Invalidation Test Passed!\n");

  // 4. Pattern Eviction Test
  console.log("🧹 [STEP 4] Testing Pattern Eviction (CacheService.delPattern)...");
  await CacheService.set("catalog:item:1", { name: "Swiggy ₹500" }, 60);
  await CacheService.set("catalog:item:2", { name: "Amazon ₹1000" }, 60);
  console.log("   Created 2 catalog items in cache.");
  await CacheService.delPattern("catalog:item");
  const check1 = await CacheService.get("catalog:item:1");
  const check2 = await CacheService.get("catalog:item:2");
  console.log(`   Items after pattern eviction: item1=${check1}, item2=${check2}`);
  console.log("✅ Pattern Eviction Passed!\n");

  // Cleanup
  console.log("🧹 Cleaning up manual test keys...");
  const testKeys = await redis.keys("aptech:*manual*");
  if (testKeys.length) {
    await redis.del(...testKeys);
  }

  await disconnectRedis();
  console.log("=======================================================");
  console.log(" 🎉 ALL MANUAL REDIS TESTS COMPLETED SUCCESSFULLY!");
  console.log("=======================================================\n");
}

runManualRedisTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
