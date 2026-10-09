import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { User } from "../src/modules/user/user.model.js";
import { Card } from "../src/modules/card/card.model.js";
import { DebitTransaction } from "../src/modules/hubble/debitTransaction.model.js";
import { HubbleService } from "../src/modules/hubble/hubble.service.js";
import { CardService } from "../src/modules/card/card.service.js";
import { AuthService } from "../src/modules/auth/auth.service.js";
import { encryptSensitive, decryptSensitive } from "../src/utils/crypto.js";
import { withDistributedLock } from "../src/utils/distributedLock.js";
import { getRedisClient } from "../src/config/redis.js";
import { env } from "../src/env.config.js";

describe("Security & QA Audit Fixes Verification", () => {
  let testUserId: string;
  let testAuthToken: string;

  beforeEach(async () => {
    await User.deleteMany({});
    await Card.deleteMany({});
    await DebitTransaction.deleteMany({});

    const user = await User.create({
      name: "Security Test Student",
      email: "security.test@example.com",
      mobile: "9876543210",
      userType: "aptech_student",
      studentId: "APT-2026-SEC01",
    });

    testUserId = user._id.toString();

    testAuthToken = jwt.sign(
      {
        id: testUserId,
        mobile: user.mobile,
        userType: user.userType,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "1h" }
    );
  });

  describe("HKDF-SHA256 Field Encryption (Fix #18)", () => {
    it("should encrypt and decrypt sensitive voucher data using HKDF key derivation", () => {
      const plaintext = "VOUCHER_SECRET_PIN_1234";
      const encrypted = encryptSensitive(plaintext);

      expect(encrypted).toMatch(/^enc:v1:/);
      expect(encrypted).not.toContain(plaintext);

      const decrypted = decryptSensitive(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should safely handle null/undefined or already plaintext values", () => {
      expect(decryptSensitive(null)).toBeNull();
      expect(decryptSensitive("not_encrypted")).toBe("not_encrypted");
    });
  });

  describe("Fail-Closed Distributed Locking in Production (Fix #13)", () => {
    it("should execute task normally when lock is acquired", async () => {
      const result = await withDistributedLock("test:lock:normal", async () => {
        return "lock_acquired_ok";
      });
      expect(result).toBe("lock_acquired_ok");
    });

    it("should fail-closed and throw 503 if Redis is disconnected in production", async () => {
      const originalEnv = process.env.NODE_ENV;
      const client = getRedisClient();
      const originalStatus = client?.status;
      try {
        process.env.NODE_ENV = "production";
        if (client) {
          Object.defineProperty(client, "status", { value: "end", configurable: true });
        }

        await expect(
          withDistributedLock("test:lock:offline", async () => "should_not_run")
        ).rejects.toThrow("Distributed lock provider is temporarily unavailable");
      } finally {
        process.env.NODE_ENV = originalEnv;
        if (client && originalStatus) {
          Object.defineProperty(client, "status", { value: originalStatus, configurable: true });
        }
      }
    });
  });

  describe("Non-Production Route & Feature Isolation (Fix #4 & #7)", () => {
    it("should reject mock KYC completion when NODE_ENV is production", async () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = "production";

        await expect(
          CardService.mockCompleteFullKyc(testUserId)
        ).rejects.toThrow("Mock KYC completion is disabled in production.");

        await expect(
          CardService.completeFullKyc(testUserId, { isMock: true })
        ).rejects.toThrow("Mock KYC completion is disabled in production.");
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it("should reject simulate SSO code when NODE_ENV is production", async () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = "production";

        await expect(
          AuthService.simulateProconnectCode()
        ).rejects.toThrow("Simulate code is disabled in production.");
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe("Card SDK Session Mobile Validation & Elimination of Hardcoded Phone (Fix #15)", () => {
    it("should reject Card SDK session if student user has invalid or missing mobile number", async () => {
      // Create active card
      await Card.create({
        userId: testUserId,
        status: "ACTIVE",
        cardId: "CRD_SEC_TEST_101",
        senderTag: "SND_SEC_TEST_101",
      });

      // Clear mobile number
      await User.findByIdAndUpdate(testUserId, { mobile: "" });

      await expect(
        CardService.getCardSdkSession(testUserId)
      ).rejects.toThrow("Valid 10-digit mobile number is required for Card SDK session.");
    });
  });

  describe("Hubble Reversal Deadlock Recovery (Fix #9)", () => {
    it("should allow re-attempting reversal if previous attempt left lock in REVERSAL_PENDING older than 30s", async () => {
      const staleTimestamp = new Date(Date.now() - 35000); // 35 seconds ago

      const debit = await DebitTransaction.create({
        userId: testUserId,
        studentId: "APT-2026-SEC01",
        amount: 100,
        transactionId: "TXN_STALE_REVERSAL_1",
        referenceId: "REF_STALE_REVERSAL_1",
        orderId: "ORD_STALE_1",
        status: "REVERSAL_PENDING",
      });

      // Force updatedAt to be in the past (bypassing mongoose timestamp on create)
      await DebitTransaction.updateOne(
        { _id: debit._id },
        { $set: { updatedAt: staleTimestamp } },
        { timestamps: false }
      );

      // Attempt reversal on this stale-locked transaction
      const reversed = await HubbleService.reverseDebit({
        transactionId: debit.transactionId,
        studentId: debit.studentId,
        amount: debit.amount,
        reason: "Retry after timeout",
      });

      expect(reversed.status).toBe("SUCCESS");

      const finalDebit = await DebitTransaction.findById(debit._id);
      expect(finalDebit?.status).toBe("REVERSED");
    });
  });

  describe("Webhook Auto-Reversal Strict User Ownership (Fix #12)", () => {
    it("should reject auto-reversal if webhook order belongs to a different student", async () => {
      // Debit belongs to student A
      await DebitTransaction.create({
        userId: testUserId,
        studentId: "APT-2026-SEC01",
        amount: 200,
        transactionId: "TXN_ORD_OWNERSHIP_1",
        orderId: "ORD_OWNERSHIP_TEST_1",
        status: "DEBITED",
      });

      // Student B attempts webhook with their userId
      const otherUser = await User.create({
        name: "Attacker User",
        email: "attacker@example.com",
        mobile: "9111122222",
        studentId: "APT-2026-ATTACK",
        userType: "aptech_student",
      });

      // Webhook payload submitted for otherUser
      const webhookPayload = {
        orderId: "ORD_OWNERSHIP_TEST_1",
        userId: otherUser._id.toString(),
        studentId: otherUser.studentId,
        brandName: "Amazon",
        status: "FAILED",
        pointsDebited: 200,
      };

      await request(app)
        .post("/api/v1/hubble/webhook/transaction-status")
        .send(webhookPayload);

      // Debit should NOT be reversed because otherUser does not own the debit
      const debitAfter = await DebitTransaction.findOne({ orderId: "ORD_OWNERSHIP_TEST_1" });
      expect(debitAfter?.status).toBe("DEBITED");
    });
  });
});
