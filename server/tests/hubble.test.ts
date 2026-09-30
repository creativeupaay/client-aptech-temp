import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { User, type IUserDocument } from "../src/modules/user/user.model.js";
import { VoucherRedemption } from "../src/modules/hubble/voucherRedemption.model.js";
import { MockAptechCoinProvider } from "../src/services/aptech-coins/index.js";
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
      expect(res.body.message).toContain("Token is required");
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

      // Verify saved in VoucherRedemption collection in DB
      const savedVoucher = await VoucherRedemption.findOne({ orderId: "HBL_ORD_991823" });
      expect(savedVoucher).not.toBeNull();
      expect(savedVoucher?.voucherCode).toBe("IKEA-GIFT-8891-9920");
      expect(savedVoucher?.pin).toBe("4491");
    });
  });

  // ==========================================================================
  // 7. Student History Endpoint
  // ==========================================================================
  describe("GET /api/v1/hubble/history", () => {
    it("should return student redemption history and live balance from Aptech", async () => {
      const res = await request(app)
        .get("/api/v1/hubble/history")
        .set("Authorization", `Bearer ${testAuthToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentBalance).toBe(500);
      expect(Array.isArray(res.body.data.vouchers)).toBe(true);
    });
  });
});
