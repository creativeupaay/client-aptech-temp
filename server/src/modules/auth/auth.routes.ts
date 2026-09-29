import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  signupSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
} from "./auth.validation.js";

const router = Router();

// Public auth endpoints
router.post("/signup", validateRequest({ body: signupSchema }), AuthController.signup);
router.post("/verify-otp", validateRequest({ body: verifyOtpSchema }), AuthController.verifyOtp);
router.post("/resend-otp", validateRequest({ body: resendOtpSchema }), AuthController.resendOtp);
router.post("/login", validateRequest({ body: loginSchema }), AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);

// Protected auth endpoints
router.get("/me", authenticate, AuthController.getMe);

export default router;
