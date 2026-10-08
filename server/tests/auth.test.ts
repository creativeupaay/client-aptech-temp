import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { User } from "../src/modules/user/user.model.js";
import { Card } from "../src/modules/card/card.model.js";

describe("Aptech ProConnect SSO & Session Management", () => {
  describe("ProConnect SSO Authorization Code Flow", () => {
    it("should reject SSO exchange if authorization code is missing or empty", async () => {
      const res = await request(app).post("/api/v1/auth/sso/exchange").send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Validation failed");
    });

    it("should reject SSO exchange if authorization code is invalid or unknown", async () => {
      const res = await request(app).post("/api/v1/auth/sso/exchange").send({
        code: "invalid_non_existent_code_12345",
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid or expired authorization code");
    });

    it("should successfully exchange code for a new Aptech student, provision user & card, and issue session", async () => {
      // 1. Generate a mock code for a new student
      const codeRes = await request(app).post("/api/v1/auth/sso/simulate-code").send({
        studentId: "APT-2026-99001",
        name: "Rohan Verma",
        mobile: "9123456780",
        email: "rohan.verma@example.com",
      });

      expect(codeRes.status).toBe(200);
      const authCode = codeRes.body.data.code;
      expect(authCode).toBeDefined();

      // 2. Exchange authorization code
      const exchangeRes = await request(app).post("/api/v1/auth/sso/exchange").send({
        code: authCode,
      });

      expect(exchangeRes.status).toBe(200);
      expect(exchangeRes.body.success).toBe(true);
      expect(exchangeRes.body.data.user.studentId).toBe("APT-2026-99001");
      expect(exchangeRes.body.data.user.name).toBe("Rohan Verma");
      expect(exchangeRes.body.data.user.mobile).toBe("9123456780");
      expect(exchangeRes.body.data.user.userType).toBe("aptech_student");
      expect(exchangeRes.body.data.user.isMobileVerified).toBe(true);
      expect(exchangeRes.body.data.isCardIssued).toBe(false);
      expect(exchangeRes.body.data.card.status).toBe("NOT_APPLIED");
      expect(exchangeRes.body.data.token).toBeDefined();

      // Verify cookies are set
      const setCookies = exchangeRes.headers["set-cookie"] as unknown as string[];
      expect(setCookies.some((c) => c.startsWith("accessToken="))).toBe(true);
      expect(setCookies.some((c) => c.startsWith("refreshToken="))).toBe(true);

      // Verify user created in DB
      const userInDb = await User.findOne({ studentId: "APT-2026-99001" });
      expect(userInDb).not.toBeNull();
      expect(userInDb?.userType).toBe("aptech_student");

      // Verify card linked in DB
      const cardInDb = await Card.findOne({ userId: userInDb?._id });
      expect(cardInDb).not.toBeNull();
      expect(cardInDb?.status).toBe("NOT_APPLIED");
    });

    it("should automatically link Student ID when an existing account authenticates via ProConnect SSO", async () => {
      // 1. Existing user in DB with same mobile number
      const existingUser = await User.create({
        name: "Pooja Hegde",
        email: "pooja.hegde@example.com",
        mobile: "9888877777",
        highestEducation: "Undergraduate / Bachelor's",
        isMobileVerified: true,
        userType: "non_aptech_student",
        status: "active",
        role: "student",
      });

      expect(existingUser.userType).toBe("non_aptech_student");
      expect(existingUser.studentId).toBeUndefined();

      // 2. Student signs in through ProConnect with same mobile
      const codeRes = await request(app).post("/api/v1/auth/sso/simulate-code").send({
        studentId: "APT-2026-77889",
        name: "Pooja Hegde",
        mobile: "9888877777",
        email: "pooja.hegde@example.com",
      });

      const exchangeRes = await request(app).post("/api/v1/auth/sso/exchange").send({
        code: codeRes.body.data.code,
      });

      expect(exchangeRes.status).toBe(200);
      expect(exchangeRes.body.data.user.id).toBe(existingUser._id.toString());
      expect(exchangeRes.body.data.user.studentId).toBe("APT-2026-77889");
      expect(exchangeRes.body.data.user.userType).toBe("aptech_student");

      // Verify DB was updated
      const userAfter = await User.findById(existingUser._id);
      expect(userAfter?.studentId).toBe("APT-2026-77889");
      expect(userAfter?.userType).toBe("aptech_student");
    });

    it("should prevent code replay by burning the single-use authorization code", async () => {
      const codeRes = await request(app).post("/api/v1/auth/sso/simulate-code").send({
        studentId: "APT-2026-REPLAY",
        name: "Single Use Test",
        mobile: "9777766666",
        email: "singleuse@example.com",
      });

      const code = codeRes.body.data.code;

      // 1st exchange: succeeds
      const firstRes = await request(app).post("/api/v1/auth/sso/exchange").send({ code });
      expect(firstRes.status).toBe(200);

      // 2nd exchange with same code: must be rejected
      const secondRes = await request(app).post("/api/v1/auth/sso/exchange").send({ code });
      expect(secondRes.status).toBe(400);
      expect(secondRes.body.message).toContain("Invalid or expired authorization code");
    });

    it("should report isCardIssued=true when an issued card already exists for the student", async () => {
      // 1. Create student and set their card to ISSUED
      const codeRes = await request(app).post("/api/v1/auth/sso/simulate-code").send({
        studentId: "APT-2026-ACTIVE",
        name: "Active Card Student",
        mobile: "9666655555",
        email: "activecard@example.com",
      });

      const firstExchange = await request(app).post("/api/v1/auth/sso/exchange").send({
        code: codeRes.body.data.code,
      });

      const userId = firstExchange.body.data.user.id;
      // Mark card as ACTIVE/ISSUED with masked PAN
      await Card.updateOne(
        { userId },
        { status: "ACTIVE", maskedPan: "•••• •••• •••• 4019" }
      );

      // 2. Next time student SSO redirects from ProConnect
      const nextCodeRes = await request(app).post("/api/v1/auth/sso/simulate-code").send({
        studentId: "APT-2026-ACTIVE",
        name: "Active Card Student",
        mobile: "9666655555",
        email: "activecard@example.com",
      });

      const secondExchange = await request(app).post("/api/v1/auth/sso/exchange").send({
        code: nextCodeRes.body.data.code,
      });

      expect(secondExchange.status).toBe(200);
      expect(secondExchange.body.data.isCardIssued).toBe(true);
      expect(secondExchange.body.data.card.status).toBe("ACTIVE");
      expect(secondExchange.body.data.card.maskedPan).toBe("•••• •••• •••• 4019");
    });
  });

  describe("Session Management & Profile Endpoints", () => {
    it("should allow session access, token refresh, and clean logout", async () => {
      // 1. Login via SSO
      const codeRes = await request(app).post("/api/v1/auth/sso/simulate-code").send({
        studentId: "APT-2026-SESSION",
        name: "Session Test Student",
        mobile: "9555544444",
        email: "session@example.com",
      });

      const exchangeRes = await request(app).post("/api/v1/auth/sso/exchange").send({
        code: codeRes.body.data.code,
      });

      expect(exchangeRes.status).toBe(200);
      const rawCookies = exchangeRes.headers["set-cookie"] as unknown as string[];
      const accessTokenCookie = rawCookies.find((c) => c.startsWith("accessToken="));
      const refreshTokenCookie = rawCookies.find((c) => c.startsWith("refreshToken="));

      // 2. Access protected /me route with cookie
      const meRes = await request(app)
        .get("/api/v1/auth/me")
        .set("Cookie", [accessTokenCookie || ""]);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.user.studentId).toBe("APT-2026-SESSION");
      expect(meRes.body.data.card.status).toBe("NOT_APPLIED");

      // 3. Refresh session using refreshToken cookie
      const refreshRes = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", [refreshTokenCookie || ""]);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data.token).toBeDefined();

      // 4. Logout and clear cookies
      const logoutRes = await request(app).post("/api/v1/auth/logout");
      expect(logoutRes.status).toBe(200);
      const logoutCookies = logoutRes.headers["set-cookie"] as unknown as string[];
      expect(logoutCookies.some((c) => c.includes("accessToken=;"))).toBe(true);
    });

    it("should reject unauthenticated access to /api/v1/auth/me", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
