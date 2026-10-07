import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  signupSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  ssoExchangeSchema,
  simulateSsoCodeSchema,
} from "./auth.validation.js";

import {
  authLoginLimiter,
  authSignupLimiter,
  sendOtpLimiter,
  ssoSimulateLimiter,
  ssoExchangeLimiter,
} from "../../middlewares/rateLimiter.middleware.js";

const router = Router();

// Public auth endpoints
router.post("/signup", authSignupLimiter, validateRequest({ body: signupSchema }), AuthController.signup);
router.post("/verify-otp", validateRequest({ body: verifyOtpSchema }), AuthController.verifyOtp);
router.post("/resend-otp", sendOtpLimiter, validateRequest({ body: resendOtpSchema }), AuthController.resendOtp);
router.post("/login", authLoginLimiter, validateRequest({ body: loginSchema }), AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);

// ProConnect SSO endpoints
router.post("/sso/exchange", ssoExchangeLimiter, validateRequest({ body: ssoExchangeSchema }), AuthController.ssoExchange);
router.post("/sso/simulate-code", ssoSimulateLimiter, validateRequest({ body: simulateSsoCodeSchema }), AuthController.simulateSsoCode);

// Protected auth endpoints
router.get("/me", authenticate, AuthController.getMe);

export default router;
