import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  ssoExchangeSchema,
  simulateSsoCodeSchema,
} from "./auth.validation.js";

import {
  ssoSimulateLimiter,
  ssoExchangeLimiter,
} from "../../middlewares/rateLimiter.middleware.js";

const router = Router();

// Session management endpoints
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);

// Aptech ProConnect SSO endpoints
router.post("/sso/exchange", ssoExchangeLimiter, validateRequest({ body: ssoExchangeSchema }), AuthController.ssoExchange);
router.post("/sso/simulate-code", ssoSimulateLimiter, validateRequest({ body: simulateSsoCodeSchema }), AuthController.simulateSsoCode);

// Authenticated student profile endpoint
router.get("/me", authenticate, AuthController.getMe);

export default router;
