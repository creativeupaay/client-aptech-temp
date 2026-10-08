import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { User } from "../src/modules/user/user.model.js";
import { Card } from "../src/modules/card/card.model.js";
import { env } from "../src/env.config.js";

describe("TransBnk Card Issuance & KYC Integration", () => {
  let authToken: string;
  let testUserId: string;

  beforeEach(async () => {
    await User.deleteMany({});
    await Card.deleteMany({});

    // Create a verified active student
    const user = await User.create({
      name: "Aarav Sharma",
      email: "aarav.sharma@example.com",
      mobile: "9987657875",
      highestEducation: "Undergraduate / Bachelor's",
      passwordHash: "secure_password_hash_12345",
      userType: "aptech_student",
      studentId: "APT-2026-00417",
      isMobileVerified: true,
      role: "student",
      status: "active",
    });

    testUserId = user._id.toString();

    authToken = jwt.sign(
      {
        id: testUserId,
        mobile: user.mobile,
        role: user.role,
        userType: user.userType,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "1h" }
    );
  });

  describe("API 1: Customer OTP Generation (POST /api/v1/card/send-otp)", () => {
    it("should reject OTP request if mobile is missing or invalid format", async () => {
      const res = await request(app).post("/api/v1/card/send-otp").send({
        mobile: "123",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "mobile",
            message: "Mobile number must be exactly 10 digits",
          }),
        ])
      );
    });

    it("should successfully generate and dispatch OTP to valid 10-digit mobile", async () => {
      const res = await request(app).post("/api/v1/card/send-otp").send({
        mobile: "9987657875",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("OTP sent successfully");
    });

    it("should enforce rate limiting and return 429 when spamming /send-otp", async () => {
      // Send 5 OTPs within window
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post("/api/v1/card/send-otp")
          .set("x-test-rate-limit", "true")
          .send({ mobile: "9987657875" });
      }

      // 6th OTP exceeds limit
      const res = await request(app)
        .post("/api/v1/card/send-otp")
        .set("x-test-rate-limit", "true")
        .send({ mobile: "9987657875" });

      expect(res.status).toBe(429);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Too many card verification OTP requests");
    });
  });

  describe("Card Details Retrieval (GET /api/v1/card/me)", () => {
    it("should reject request without authentication token", async () => {
      const res = await request(app).get("/api/v1/card/me");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return default NOT_APPLIED card if user has not yet applied", async () => {
      const res = await request(app)
        .get("/api/v1/card/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.card.status).toBe("NOT_APPLIED");
      expect(res.body.data.card.totalLimit).toBe(10000);
      expect(res.body.data.card.availableBalance).toBe(0);
    });
  });

  describe("API 2, 4, 5: Customer Register & Async Virtual GPR Card Issuance", () => {
    it("should fail validation if terms are not accepted", async () => {
      const res = await request(app)
        .post("/api/v1/card/register-and-issue")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Aarav Sharma",
          email: "aarav@example.com",
          mobile: "9987657875",
          documentType: "AADHAR_NUMBER",
          documentValue: "123456789012",
          otp: "381642",
          termsAccepted: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Validation failed");
    });

    it("should fail validation if documentType is invalid", async () => {
      const res = await request(app)
        .post("/api/v1/card/register-and-issue")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Aarav Sharma",
          email: "aarav@example.com",
          mobile: "9987657875",
          documentType: "INVALID_DOC_TYPE",
          documentValue: "123456789012",
          otp: "381642",
          termsAccepted: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject invalid Aadhaar number format (must be 12 digits)", async () => {
      const res = await request(app)
        .post("/api/v1/card/register-and-issue")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Aarav Sharma",
          email: "aarav@example.com",
          mobile: "9987657875",
          documentType: "AADHAR_NUMBER",
          documentValue: "12345", // Only 5 digits
          otp: "381642",
          termsAccepted: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "documentValue",
            message: "Aadhaar number must be exactly 12 numeric digits",
          }),
        ])
      );
    });

    it("should reject applicant who is underage (< 15 years old)", async () => {
      const res = await request(app)
        .post("/api/v1/card/register-and-issue")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Aarav Sharma",
          email: "aarav@example.com",
          mobile: "9987657875",
          documentType: "AADHAR_NUMBER",
          documentValue: "123456789012",
          dateOfBirth: "2020-01-01", // Underage
          otp: "381642",
          termsAccepted: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "dateOfBirth",
            message: "Applicant must be at least 15 years old for card issuance",
          }),
        ])
      );
    });

    it("should register customer, provision virtual GPR card, poll to active state, and return card details", async () => {
      const res = await request(app)
        .post("/api/v1/card/register-and-issue")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Aarav Sharma",
          email: "aarav@example.com",
          mobile: "9987657875",
          documentType: "AADHAR_NUMBER",
          documentValue: "123456789012",
          dateOfBirth: "1998-11-17",
          otp: "381642",
          termsAccepted: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.card.status).toBe("ACTIVE");
      expect(res.body.data.card.senderTag).toBeDefined();
      expect(res.body.data.card.cardId).toBeDefined();
      expect(res.body.data.card.referenceId).toBeDefined();
      expect(res.body.data.card.maskedPan).toBe("•••• •••• •••• 8942");
      expect((res.body.data.card as Record<string, unknown>).cardNumber).toBeUndefined();
      expect((res.body.data.card as Record<string, unknown>).expiry).toBeUndefined();
      expect(res.body.data.card.totalLimit).toBe(10000);
      expect(res.body.data.card.availableBalance).toBe(0);
      expect(res.body.data.card.cvv).toBeUndefined();

      // Verify MongoDB persistence (PCI-DSS compliance: no sensitive data stored)
      const savedCard = await Card.findOne({ userId: testUserId });
      expect(savedCard).not.toBeNull();
      expect(savedCard?.status).toBe("ACTIVE");
      expect(savedCard?.cardId).toBe(res.body.data.card.cardId);
      expect(savedCard?.maskedPan).toBe("•••• •••• •••• 8942");
      expect((savedCard as unknown as Record<string, unknown>).cardNumber).toBeUndefined();
      expect((savedCard as unknown as Record<string, unknown>).expiry).toBeUndefined();
    });
  });

  describe("API 3: Full KYC Upgrade & In-App Aadhaar/PAN Verification", () => {
    beforeEach(async () => {
      // Pre-issue card
      await request(app)
        .post("/api/v1/card/register-and-issue")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Aarav Sharma",
          email: "aarav@example.com",
          mobile: "9987657875",
          documentType: "AADHAR_NUMBER",
          documentValue: "123456789012",
          otp: "381642",
          termsAccepted: true,
        });
    });

    it("should generate a Full KYC URL session from TransBnk", async () => {
      const res = await request(app)
        .post("/api/v1/card/full-kyc-url")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toContain("https://carduat.oxymoney.com");
      expect(res.body.data.kycRequired).toBe(true);
    });

    it("should reject in-app Full KYC if PAN format is invalid", async () => {
      const res = await request(app)
        .post("/api/v1/card/complete-kyc")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          aadhaarNumber: "123456789012",
          aadhaarOtp: "123456",
          panNumber: "invalid_pan",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should successfully complete Full KYC and upgrade card limit to ₹2,00,000", async () => {
      const res = await request(app)
        .post("/api/v1/card/complete-kyc")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          aadhaarNumber: "1234 5678 9012",
          aadhaarOtp: "123456",
          panNumber: "ABCDE1234F",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.newLimit).toBe(200000);
      expect(res.body.data.card.kycStatus).toBe("FULL_KYC");
      expect(res.body.data.card.totalLimit).toBe(200000);

      // Verify in DB
      const updatedCard = await Card.findOne({ userId: testUserId });
      expect(updatedCard?.kycStatus).toBe("FULL_KYC");
      expect(updatedCard?.totalLimit).toBe(200000);
    });
  });



  describe("API 3 Dual-Use: Full KYC Status Inquiry (GET /api/v1/card/kyc-status)", () => {
    it("should query TransBnk Full KYC status and return pending details before verification", async () => {
      // Issue card first
      await request(app)
        .post("/api/v1/card/register-and-issue")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Aarav Sharma",
          email: "aarav@example.com",
          mobile: "9987657875",
          documentType: "AADHAR_NUMBER",
          documentValue: "123456789012",
          otp: "381642",
          termsAccepted: true,
        });

      const res = await request(app)
        .get("/api/v1/card/kyc-status")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kycRequired).toBe(true);
      expect(res.body.data.isCompleted).toBe(false);
      expect(res.body.data.url).toContain("oxymoney.com");
    });

    it("should reflect Full KYC completion and upgrade limit when gateway verifies KYC", async () => {
      // Issue card
      await request(app)
        .post("/api/v1/card/register-and-issue")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Aarav Sharma",
          email: "aarav@example.com",
          mobile: "9987657875",
          documentType: "AADHAR_NUMBER",
          documentValue: "123456789012",
          otp: "381642",
          termsAccepted: true,
        });

      // Complete KYC
      await request(app)
        .post("/api/v1/card/complete-kyc")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          aadhaarNumber: "123456789012",
          aadhaarOtp: "123456",
          panNumber: "ABCDE1234F",
        });

      const res = await request(app)
        .get("/api/v1/card/kyc-status")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isCompleted).toBe(true);
      expect(res.body.data.kycStatus).toBe("FULL_KYC");
      expect(res.body.data.totalLimit).toBe(200000);
    });
  });

  describe("API 5: Card Creation Status Polling (GET /api/v1/card/poll-status)", () => {
    it("should poll and return active card state", async () => {
      await request(app)
        .post("/api/v1/card/register-and-issue")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Aarav Sharma",
          email: "aarav@example.com",
          mobile: "9987657875",
          documentType: "AADHAR_NUMBER",
          documentValue: "123456789012",
          otp: "381642",
          termsAccepted: true,
        });

      const res = await request(app)
        .get("/api/v1/card/poll-status")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.card.status).toBe("ACTIVE");
      expect(res.body.data.card.cardId).toBeDefined();
    });
  });

  describe("PCI-DSS Scoped Card SDK Session (GET /api/v1/card/sdk-session)", () => {
    it("should initialize a secure Card SDK session for active card", async () => {
      await request(app)
        .post("/api/v1/card/register-and-issue")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Aarav Sharma",
          email: "aarav@example.com",
          mobile: "9987657875",
          documentType: "AADHAR_NUMBER",
          documentValue: "123456789012",
          otp: "381642",
          termsAccepted: true,
        });

      const res = await request(app)
        .get("/api/v1/card/sdk-session")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cardId).toBeDefined();
      expect(res.body.data.senderTag).toBeDefined();
      expect(res.body.data.sdkSessionToken).toBeDefined();
      expect(res.body.data.maskedPan).toBeDefined();
    });
  });

  describe("API 2 & 4 Enhancements: DOB Normalization & Standalone Issuance", () => {
    it("should accept DD/MM/YYYY dateOfBirth and normalize it to YYYY-MM-DD", async () => {
      const res = await request(app)
        .post("/api/v1/card/register-and-issue")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Aarav Sharma",
          email: "aarav@example.com",
          mobile: "9987657875",
          documentType: "AADHAR_NUMBER",
          documentValue: "123456789012",
          dateOfBirth: "17 / 11 / 1998",
          otp: "381642",
          termsAccepted: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.card.status).toBe("ACTIVE");
    });

    it("should support standalone card issuance via POST /api/v1/card/issue-card when senderTag exists", async () => {
      // First save a card with senderTag
      await Card.create({
        userId: testUserId,
        status: "NOT_APPLIED",
        senderTag: "sender_tag_existing_123",
        cardType: "VIRTUAL",
        kycStatus: "MIN_KYC",
        availableBalance: 0,
        totalLimit: 10000,
        isLocked: false,
        isCardEnabled: true,
      });

      const res = await request(app)
        .post("/api/v1/card/issue-card")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.card.status).toBe("ACTIVE");
      expect(res.body.data.card.cardId).toBeDefined();
    });
  });

  describe("Security, Concurrency & State Machine Hardening", () => {
    it("should reject card registration if mobile number does not match registered profile", async () => {
      const res = await request(app)
        .post("/api/v1/card/register-and-issue")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Aarav Sharma",
          email: "aarav@example.com",
          mobile: "9123456780", // Mismatched mobile (profile has 9987657875)
          documentType: "AADHAR_NUMBER",
          documentValue: "123456789012",
          otp: "381642",
          termsAccepted: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Mobile number does not match your registered profile");
    });



    it("should preserve Full KYC limit of ₹2,00,000 when polling card status for verified customer", async () => {
      // Create card with FULL_KYC and APPLICATION_PENDING
      await Card.create({
        userId: testUserId,
        status: "APPLICATION_PENDING",
        senderTag: "sender_tag_full_kyc_123",
        referenceId: "ref_12345",
        cardType: "VIRTUAL",
        kycStatus: "FULL_KYC",
        availableBalance: 0,
        totalLimit: 200000,
        isLocked: false,
        isCardEnabled: true,
      });

      const res = await request(app)
        .get("/api/v1/card/poll-status")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.card.status).toBe("ACTIVE");
      expect(res.body.data.card.kycStatus).toBe("FULL_KYC");
      expect(res.body.data.card.totalLimit).toBe(200000);
    });
  });
});
