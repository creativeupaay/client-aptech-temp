import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { User, type IUserDocument } from "../src/modules/user/user.model.js";
import { VoucherRedemption } from "../src/modules/hubble/voucherRedemption.model.js";
import { DebitTransaction } from "../src/modules/hubble/debitTransaction.model.js";
import { MockAptechCoinProvider } from "../src/services/aptech-coins/index.js";
import { decryptSensitive } from "../src/utils/crypto.js";
import { env } from "../src/env.config.js";

describe("Hubble Money Integration (Stateless Proxy to Aptech Coin API)", () => {
  let testUser: IUserDocument;
  let testAuthToken: string;

  beforeEach(async () => {
    // Reset mock coin provider balances
    MockAptechCoinProvider.getInstance().reset({
      "APT-2026-00417": 500,
    });

    // Seed a verified Aptech student (Points are NOT stored in MongoDB!)
    testUser = await User.create({
      name: "Aarav Sharma",
      email: "aarav.sharma@aptech.ac.in",
      mobile: "9876543210",
      studentId: "APT-2026-00417",
      highestEducation: "Undergraduate / Bachelor's",
      passwordHash: "hashed_dummy_password",
      isMobileVerified: true,
      isEmailVerified: true,
      status: "active",
      userType: "aptech_student",
      role: "student",
    });

    // Create a valid JWT access token for student authenticated routes
    testAuthToken = jwt.sign(
      {
        id: testUser._id.toString(),
        mobile: testUser.mobile,
        role: testUser.role,
        userType: testUser.userType,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );
  });

  // ==========================================================================
  // 1. Launch URL Generation (Called by React Frontend)
  // ==========================================================================
  describe("POST /api/v1/hubble/launch-url", () => {
    it("should reject unauthenticated requests with 401 Unauthorized", async () => {
      const res = await request(app).post("/api/v1/hubble/launch-url");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Authentication required");
    });

    it("should successfully generate authenticated Hubble SDK launch URL with points from Aptech", async () => {
      const res = await request(app)
        .post("/api/v1/hubble/launch-url")
        .set("Authorization", `Bearer ${testAuthToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("launchUrl");
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data.student.studentId).toBe("APT-2026-00417");
      expect(res.body.data.student.loyaltyPoints).toBe(500);

      // Verify URL components
      const launchUrl = res.body.data.launchUrl;
      expect(launchUrl).toContain("clientId=tbx-cards-loyalty-dev-sdk-fqlxyqb3");
      expect(launchUrl).toContain("theme=light");
      expect(launchUrl).toContain("token=");
    });
  });

  // ==========================================================================
  // 2. Classic SSO Endpoint (Called by Hubble Cloud)
  // ==========================================================================
  describe("POST /api/v1/hubble/sso", () => {
    it("should reject request if token is missing", async () => {
      const res = await request(app).post("/api/v1/hubble/sso").send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toContain("Token is required");
    });

    it("should validate signed token and return student profile with Aptech points", async () => {
      // First get a real launch token
      const launchRes = await request(app)
        .post("/api/v1/hubble/launch-url")
        .set("Authorization", `Bearer ${testAuthToken}`);

      const ssoToken = launchRes.body.data.token;

      const res = await request(app).post("/api/v1/hubble/sso").send({ token: ssoToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(testUser._id.toString());
      expect(res.body.data.studentId).toBe("APT-2026-00417");
      expect(res.body.data.loyaltyPoints).toBe(500);
      expect(res.body.balance).toBe(500);
    });

    it("should handle mock tokens gracefully in test mode", async () => {
      const res = await request(app)
        .post("/api/v1/hubble/sso")
        .send({ token: "hbl_mock_test_token" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.studentId).toBeDefined();
      expect(res.body.data.loyaltyPoints).toBeDefined();
    });

    it("should validate token passed via query parameter in POST /sso?token=...", async () => {
      const res = await request(app)
        .post("/api/v1/hubble/sso?token=hbl_mock_query_token")
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.studentId).toBeDefined();
    });

    it("should reject tampered or invalid JWT tokens with 401 Unauthorized", async () => {
      const res = await request(app)
        .post("/api/v1/hubble/sso")
        .send({ token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid_tampered_payload.signature" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid or expired session token");
    });
  });

  // ==========================================================================
  // 3. Coin Balance Endpoint (Called by Hubble Cloud)
  // ==========================================================================
  describe("POST & GET /api/v1/hubble/balance", () => {
    it("should return student's loyalty points balance via POST from Aptech", async () => {
      const res = await request(app)
        .post("/api/v1/hubble/balance")
        .send({ userId: testUser._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.balance).toBe(500);
      expect(res.body.currency).toBe("POINTS");
    });

    it("should return student's loyalty points balance via GET with query params", async () => {
      const res = await request(app)
        .get(`/api/v1/hubble/balance?userId=${testUser._id.toString()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.balance).toBe(500);
    });
  });

  // ==========================================================================
  // 4. Debit Coins API (Proxied to Aptech Coin API)
  // ==========================================================================
  describe("POST /api/v1/hubble/debit", () => {
    it("should successfully debit coins from Aptech without storing ledger in MongoDB", async () => {
      const debitPayload = {
        userId: testUser._id.toString(),
        amount: 200,
        transactionId: "TXN_TEST_DEBIT_1001",
        brandName: "Flipkart",
        orderId: "ORD_HBL_88219",
      };

      const res = await request(app).post("/api/v1/hubble/debit").send(debitPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.debitedAmount).toBe(200);
      expect(res.body.data.remainingBalance).toBe(300);
      expect(res.body.data.transactionId).toBe("TXN_TEST_DEBIT_1001");

      // Verify points were debited at Aptech provider
      const coinCheck = await MockAptechCoinProvider.getInstance().getBalance("APT-2026-00417");
      expect(coinCheck.balance).toBe(300);
    });

    it("should reject debit when balance is insufficient at Aptech", async () => {
      const res = await request(app).post("/api/v1/hubble/debit").send({
        userId: testUser._id.toString(),
        amount: 1500, // Available is only 500
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Insufficient loyalty points balance");

      // Balance must remain unchanged at Aptech
      const coinCheck = await MockAptechCoinProvider.getInstance().getBalance("APT-2026-00417");
      expect(coinCheck.balance).toBe(500);
    });

    it("should reject debit if amount is non-positive or invalid", async () => {
      const res = await request(app).post("/api/v1/hubble/debit").send({
        userId: testUser._id.toString(),
        amount: -50,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should handle duplicate debit calls idempotently without double-debiting points", async () => {
      const debitPayload = {
        userId: testUser._id.toString(),
        amount: 100,
        transactionId: "TXN_IDEM_DEBIT_TEST",
        orderId: "ORD_IDEM_1001",
        brandName: "Myntra",
      };

      // Call 1
      const res1 = await request(app).post("/api/v1/hubble/debit").send(debitPayload);
      expect(res1.status).toBe(200);
      expect(res1.body.data.debitedAmount).toBe(100);
      expect(res1.body.data.remainingBalance).toBe(400);

      // Call 2 (Duplicate replay)
      const res2 = await request(app).post("/api/v1/hubble/debit").send(debitPayload);
      expect(res2.status).toBe(200);
      expect(res2.body.data.isIdempotent).toBe(true);
      expect(res2.body.data.remainingBalance).toBe(400);

      // Verify points in provider: debited only once (500 - 100 = 400, NOT 300)
      const coinCheck = await MockAptechCoinProvider.getInstance().getBalance("APT-2026-00417");
      expect(coinCheck.balance).toBe(400);
    });
  });

  // ==========================================================================
  // 5. Reverse Debit API (Proxied to Aptech Coin API)
  // ==========================================================================
  describe("POST /api/v1/hubble/reverse", () => {
    it("should reverse a previous debit and restore student points balance at Aptech", async () => {
      // Step 1: Debit 150 points first
      await request(app).post("/api/v1/hubble/debit").send({
        userId: testUser._id.toString(),
        amount: 150,
        transactionId: "TXN_TO_BE_REVERSED",
        brandName: "Amazon",
      });

      const coinAfterDebit = await MockAptechCoinProvider.getInstance().getBalance("APT-2026-00417");
      expect(coinAfterDebit.balance).toBe(350);

      // Step 2: Call reverse
      const reverseRes = await request(app).post("/api/v1/hubble/reverse").send({
        userId: testUser._id.toString(),
        originalTransactionId: "TXN_TO_BE_REVERSED",
        amount: 150,
        reason: "Hubble voucher inventory depleted",
      });

      expect(reverseRes.status).toBe(200);
      expect(reverseRes.body.success).toBe(true);
      expect(reverseRes.body.data.refundedAmount).toBe(150);
      expect(reverseRes.body.data.newBalance).toBe(500);

      // Step 3: Verify Aptech provider restored balance
      const coinAfterRefund = await MockAptechCoinProvider.getInstance().getBalance("APT-2026-00417");
      expect(coinAfterRefund.balance).toBe(500);
    });

    it("should reject reversal if original debit transaction was not found", async () => {
      const res = await request(app).post("/api/v1/hubble/reverse").send({
        userId: testUser._id.toString(),
        originalTransactionId: "NON_EXISTENT_TXN_99999",
        amount: 100,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("not found");
    });

    it("should handle duplicate reversal requests idempotently without double-refunding points", async () => {
      // Step 1: Debit 100 points
      await request(app).post("/api/v1/hubble/debit").send({
        userId: testUser._id.toString(),
        amount: 100,
        transactionId: "TXN_DOUBLE_REV_TEST",
        brandName: "Flipkart",
      });

      // Step 2: First Reversal (restores 100 points to 500)
      const firstRev = await request(app).post("/api/v1/hubble/reverse").send({
        userId: testUser._id.toString(),
        originalTransactionId: "TXN_DOUBLE_REV_TEST",
        amount: 100,
      });
      expect(firstRev.status).toBe(200);
      expect(firstRev.body.data.newBalance).toBe(500);

      // Step 3: Second duplicate Reversal replay (should be idempotent - balance stays 500)
      const secondRev = await request(app).post("/api/v1/hubble/reverse").send({
        userId: testUser._id.toString(),
        originalTransactionId: "TXN_DOUBLE_REV_TEST",
        amount: 100,
      });
      expect(secondRev.status).toBe(200);
      expect(secondRev.body.data.newBalance).toBe(500);

      // Verify Aptech provider balance remains 500 (NOT 600)
      const coinCheck = await MockAptechCoinProvider.getInstance().getBalance("APT-2026-00417");
      expect(coinCheck.balance).toBe(500);
    });

    it("should resolve student accurately when userId is omitted from reverse payload", async () => {
      // Step 1: Debit 120 points
      await request(app).post("/api/v1/hubble/debit").send({
        userId: testUser._id.toString(),
        amount: 120,
        transactionId: "TXN_NO_USERID_TEST",
        brandName: "Uber",
      });

      // Step 2: Reverse passing only originalTransactionId
      const reverseRes = await request(app).post("/api/v1/hubble/reverse").send({
        originalTransactionId: "TXN_NO_USERID_TEST",
        reason: "Cancelled by Hubble",
      });

      expect(reverseRes.status).toBe(200);
      expect(reverseRes.body.success).toBe(true);
      expect(reverseRes.body.data.refundedAmount).toBe(120);
      expect(reverseRes.body.data.newBalance).toBe(500);
      expect(reverseRes.body.data.studentId).toBe("APT-2026-00417");
    });
  });

  // ==========================================================================
  // 6. CORS Configuration for Hubble Integration
  // ==========================================================================
  describe("CORS Configuration for Hubble Integration", () => {
    it("should allow X-Hubble-Secret in preflight OPTIONS requests", async () => {
      const res = await request(app)
        .options("/api/v1/hubble/debit")
        .set("Origin", "http://localhost:5173")
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "X-Hubble-Secret, Content-Type");

      expect(res.status).toBe(204);
      const allowHeaders = (res.headers["access-control-allow-headers"] as string) || "";
      expect(allowHeaders.toLowerCase()).toContain("x-hubble-secret");
    });
  });

  // ==========================================================================
  // 6. Webhook for Transaction Status & Voucher Fulfillment
  // ==========================================================================
  describe("POST /api/v1/hubble/webhook/transaction-status", () => {
    it("should record fulfilled voucher details into student redemption history", async () => {
      const webhookPayload = {
        orderId: "HBL_ORD_991823",
        userId: testUser._id.toString(),
        studentId: testUser.studentId,
        brandName: "IKEA",
        voucherCode: "IKEA-GIFT-8891-9920",
        pin: "4491",
        denomination: 1000,
        pointsDebited: 1000,
        expiryDate: "2027-09-30",
        redemptionUrl: "https://ikea.com/redeem?code=IKEA-GIFT-8891",
        status: "ACTIVE",
      };

      const res = await request(app)
        .post("/api/v1/hubble/webhook/transaction-status")
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderId).toBe("HBL_ORD_991823");

      // Verify saved in VoucherRedemption collection in DB is encrypted at rest (Item 7)
      const savedVoucher = await VoucherRedemption.findOne({ orderId: "HBL_ORD_991823" });
      expect(savedVoucher).not.toBeNull();
      expect(savedVoucher?.voucherCode?.startsWith("enc:v1:")).toBe(true);
      expect(savedVoucher?.pin?.startsWith("enc:v1:")).toBe(true);

      // Verify decrypted values match original plain text
      expect(decryptSensitive(savedVoucher?.voucherCode || "")).toBe("IKEA-GIFT-8891-9920");
      expect(decryptSensitive(savedVoucher?.pin || "")).toBe("4491");
    });

    it("should accept payment gateway statuses like SUCCESS and normalize to ACTIVE (Item 11)", async () => {
      const webhookPayload = {
        orderId: "HBL_ORD_GATEWAY_SUCCESS_01",
        userId: testUser._id.toString(),
        brandName: "Flipkart",
        voucherCode: "FLIP-GIFT-2026",
        pin: "9876",
        status: "SUCCESS", // Payment gateway status
      };

      const res = await request(app)
        .post("/api/v1/hubble/webhook/transaction-status")
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const savedVoucher = await VoucherRedemption.findOne({ orderId: "HBL_ORD_GATEWAY_SUCCESS_01" });
      expect(savedVoucher).not.toBeNull();
      expect(savedVoucher?.status).toBe("ACTIVE");
    });

    it("should automatically refund student coins via reverseDebit when webhook reports FAILED status", async () => {
      // 1. First record an active debit transaction for an order
      await DebitTransaction.create({
        userId: testUser._id,
        studentId: testUser.studentId,
        amount: 250,
        transactionId: "TXN_HUBBLE_FAILED_ORDER_1",
        orderId: "HBL_ORD_FAILED_999",
        status: "DEBITED",
      });

      // 2. Simulate webhook reporting that order failed on merchant side
      const webhookPayload = {
        orderId: "HBL_ORD_FAILED_999",
        userId: testUser._id.toString(),
        studentId: testUser.studentId,
        brandName: "Amazon",
        status: "FAILED",
        pointsDebited: 250,
      };

      const res = await request(app)
        .post("/api/v1/hubble/webhook/transaction-status")
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // 3. Verify voucher is marked REFUNDED
      const savedVoucher = await VoucherRedemption.findOne({ orderId: "HBL_ORD_FAILED_999" });
      expect(savedVoucher).not.toBeNull();
      expect(savedVoucher?.status).toBe("REFUNDED");

      // 4. Verify debit transaction is marked REVERSED
      const updatedDebit = await DebitTransaction.findOne({ orderId: "HBL_ORD_FAILED_999" });
      expect(updatedDebit?.status).toBe("REVERSED");
    });
  });

  // ==========================================================================
  // 7. Student History Endpoint
  // ==========================================================================
  describe("GET /api/v1/hubble/history", () => {
    it("should return student redemption history and live balance from Aptech with decrypted vouchers", async () => {
      const res = await request(app)
        .get("/api/v1/hubble/history")
        .set("Authorization", `Bearer ${testAuthToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentBalance).toBe(500);
      expect(Array.isArray(res.body.data.vouchers)).toBe(true);

      if (res.body.data.vouchers.length > 0) {
        const voucher = res.body.data.vouchers[0];
        // Decrypted and readable by authenticated student
        expect(voucher.voucherCode).not.toContain("enc:v1:");
      }
    });
  });
});
