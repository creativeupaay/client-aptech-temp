import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { User } from "../src/modules/user/user.model.js";
import { Card } from "../src/modules/card/card.model.js";
import { Otp } from "../src/modules/otp/otp.model.js";
import { env } from "../src/env.config.js";

describe("Non-Aptech Student Signup & OTP Verification Flow", () => {
  const validSignupData = {
    name: "Aakash Sharma",
    email: "aakash.sharma@example.com",
    mobile: "+91 9876543210",
    highestEducation: "Undergraduate / Bachelor's",
    password: "Password@123",
    confirmPassword: "Password@123",
  };

  it("should fail validation if required fields are missing", async () => {
    const res = await request(app).post("/api/v1/auth/signup").send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it("should fail validation if mobile number is invalid", async () => {
    const res = await request(app).post("/api/v1/auth/signup").send({
      ...validSignupData,
      mobile: "12345",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "mobile",
          message: "Please enter a valid 10-digit mobile number",
        }),
      ])
    );
  });

  it("should fail validation if passwords do not match", async () => {
    const res = await request(app).post("/api/v1/auth/signup").send({
      ...validSignupData,
      confirmPassword: "DifferentPassword@123",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "confirmPassword",
          message: "Confirm password does not match password",
        }),
      ])
    );
  });

  it("should successfully initiate signup, create unverified user, and send OTP", async () => {
    const res = await request(app).post("/api/v1/auth/signup").send(validSignupData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mobile).toBe("9876543210");
    expect(res.body.data.isNewUser).toBe(true);
    expect(res.body.data.debugOtp).toBeDefined();

    // Verify DB state
    const userInDb = await User.findOne({ mobile: "9876543210" }).select("+passwordHash");
    expect(userInDb).not.toBeNull();
    expect(userInDb?.name).toBe("Aakash Sharma");
    expect(userInDb?.isMobileVerified).toBe(false);
    expect(userInDb?.status).toBe("pending_verification");
    expect(userInDb?.passwordHash).not.toBe("Password@123"); // Password is encrypted

    // Verify OTP record created
    const otpRecord = await Otp.findOne({ mobile: "9876543210" });
    expect(otpRecord).not.toBeNull();
    expect(otpRecord?.purpose).toBe("SIGNUP_VERIFICATION");
  });

  it("should allow incomplete signup retry with fresh OTP without throwing conflict", async () => {
    // 1st attempt
    await request(app).post("/api/v1/auth/signup").send(validSignupData);

    // 2nd attempt with updated name
    const retryRes = await request(app).post("/api/v1/auth/signup").send({
      ...validSignupData,
      name: "Aakash S. Sharma",
    });

    expect(retryRes.status).toBe(201);
    expect(retryRes.body.data.isNewUser).toBe(false);

    const user = await User.findOne({ mobile: "9876543210" });
    expect(user?.name).toBe("Aakash S. Sharma");
    expect(user?.isMobileVerified).toBe(false);
  });

  it("should fail verification when an incorrect OTP is provided", async () => {
    await request(app).post("/api/v1/auth/signup").send(validSignupData);

    const verifyRes = await request(app).post("/api/v1/auth/verify-otp").send({
      mobile: "9876543210",
      otp: "000000",
    });

    expect(verifyRes.status).toBe(400);
    expect(verifyRes.body.success).toBe(false);
    expect(verifyRes.body.message).toContain("Invalid OTP");
  });

  it("should successfully verify OTP, activate user, initialize lean card, and issue JWT", async () => {
    const signupRes = await request(app).post("/api/v1/auth/signup").send(validSignupData);
    const otpCode = signupRes.body.data.debugOtp;

    const verifyRes = await request(app).post("/api/v1/auth/verify-otp").send({
      mobile: "9876543210",
      otp: otpCode,
    });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.token).toBeDefined();
    expect(verifyRes.body.data.user.isMobileVerified).toBe(true);
    expect(verifyRes.body.data.user.status).toBe("active");
    expect(verifyRes.body.data.card.status).toBe("NOT_APPLIED");

    // Verify JWT payload
    const accessSecret = env.JWT_ACCESS_SECRET;
    const decoded = jwt.verify(verifyRes.body.data.token, accessSecret) as {
      id: string;
      mobile: string;
      role: string;
    };
    expect(decoded.mobile).toBe("9876543210");

    expect(decoded.role).toBe("student");

    // Verify lean Card linkage created in DB
    const cardInDb = await Card.findOne({ userId: verifyRes.body.data.user.id });
    expect(cardInDb).not.toBeNull();
    expect(cardInDb?.status).toBe("NOT_APPLIED");
    expect(cardInDb?.cardType).toBe("VIRTUAL");

    // Verify OTP record was deleted after successful verification
    const otpRecord = await Otp.findOne({ mobile: "9876543210" });
    expect(otpRecord).toBeNull();
  });

  it("should reject signup with 409 Conflict if mobile is already verified", async () => {
    // 1. Signup
    const signupRes = await request(app).post("/api/v1/auth/signup").send(validSignupData);
    // 2. Verify
    await request(app).post("/api/v1/auth/verify-otp").send({
      mobile: "9876543210",
      otp: signupRes.body.data.debugOtp,
    });

    // 3. Attempt signup again with same mobile
    const duplicateRes = await request(app).post("/api/v1/auth/signup").send(validSignupData);

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.message).toContain("already exists");
  });

  it("should allow resending OTP for unverified registrations", async () => {
    await request(app).post("/api/v1/auth/signup").send(validSignupData);

    const resendRes = await request(app).post("/api/v1/auth/resend-otp").send({
      mobile: "9876543210",
    });

    expect(resendRes.status).toBe(200);
    expect(resendRes.body.success).toBe(true);
    expect(resendRes.body.data.debugOtp).toBeDefined();
  });

  describe("Student Login API", () => {
    it("should successfully log in with verified mobile/email and correct password", async () => {
      // Setup verified user with card
      const signupRes = await request(app).post("/api/v1/auth/signup").send(validSignupData);
      await request(app).post("/api/v1/auth/verify-otp").send({
        mobile: "9876543210",
        otp: signupRes.body.data.debugOtp,
      });

      // Login using mobile
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        identifier: "+91 9876543210",
        password: "Password@123",
      });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.token).toBeDefined();
      expect(loginRes.body.data.user.mobile).toBe("9876543210");
      expect(loginRes.body.data.card.status).toBe("NOT_APPLIED");

      // Verify HTTP-only cookies are properly set
      const cookies = loginRes.headers["set-cookie"] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes("accessToken=") && c.includes("HttpOnly"))).toBe(true);
      expect(cookies.some((c) => c.includes("refreshToken=") && c.includes("HttpOnly"))).toBe(true);

      // Login using email
      const emailLoginRes = await request(app).post("/api/v1/auth/login").send({
        identifier: "aakash.sharma@example.com",
        password: "Password@123",
      });

      expect(emailLoginRes.status).toBe(200);
      expect(emailLoginRes.body.success).toBe(true);
      expect(emailLoginRes.body.data.token).toBeDefined();
    });

    it("should reject login with 401 on incorrect password or invalid user", async () => {
      // Non-existent user
      const notFoundRes = await request(app).post("/api/v1/auth/login").send({
        identifier: "9999999999",
        password: "Password@123",
      });
      expect(notFoundRes.status).toBe(401);
      expect(notFoundRes.body.success).toBe(false);

      // Wrong password
      const signupRes = await request(app).post("/api/v1/auth/signup").send(validSignupData);
      await request(app).post("/api/v1/auth/verify-otp").send({
        mobile: "9876543210",
        otp: signupRes.body.data.debugOtp,
      });

      const wrongPwdRes = await request(app).post("/api/v1/auth/login").send({
        identifier: "9876543210",
        password: "WrongPassword@999",
      });
      expect(wrongPwdRes.status).toBe(401);
      expect(wrongPwdRes.body.success).toBe(false);
    });

    it("should reject login with 403 if student has not completed mobile OTP verification", async () => {
      // Unverified signup only
      await request(app).post("/api/v1/auth/signup").send(validSignupData);

      const loginRes = await request(app).post("/api/v1/auth/login").send({
        identifier: "9876543210",
        password: "Password@123",
      });

      expect(loginRes.status).toBe(403);
      expect(loginRes.body.success).toBe(false);
      expect(loginRes.body.message).toContain("verification");
    });

    it("should support token refresh via HTTP-only cookie and access protected /me route", async () => {
      // Setup verified user
      const signupRes = await request(app).post("/api/v1/auth/signup").send(validSignupData);
      const verifyRes = await request(app).post("/api/v1/auth/verify-otp").send({
        mobile: "9876543210",
        otp: signupRes.body.data.debugOtp,
      });

      const rawCookies = verifyRes.headers["set-cookie"] as unknown as string[];
      const refreshTokenCookie = rawCookies.find((c) => c.startsWith("refreshToken="));
      const accessTokenCookie = rawCookies.find((c) => c.startsWith("accessToken="));

      // Access protected /me route with cookie
      const meRes = await request(app)
        .get("/api/v1/auth/me")
        .set("Cookie", [accessTokenCookie || ""]);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.user.mobile).toBe("9876543210");
      expect(meRes.body.data.card.status).toBe("NOT_APPLIED");

      // Refresh session using refreshToken cookie
      const refreshRes = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", [refreshTokenCookie || ""]);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data.token).toBeDefined();

      // Logout and clear cookies
      const logoutRes = await request(app).post("/api/v1/auth/logout");
      expect(logoutRes.status).toBe(200);
      const logoutCookies = logoutRes.headers["set-cookie"] as unknown as string[];
      expect(logoutCookies.some((c) => c.includes("accessToken=;"))).toBe(true);
    });
  });
});


