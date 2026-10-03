import { Router } from "express";
import { CardController } from "./card.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { cardOtpIpLimiter, cardOtpLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  completeFullKycSchema,
  loadMoneySchema,
  registerAndIssueCardSchema,
  sendCardOtpSchema,
  updateCardControlsSchema,
} from "./card.validation.js";

const router = Router();

// Public / Pre-issuance OTP generation (API 1) - Protected by multi-tier rate limiting (IP + Mobile)
router.post(
  "/send-otp",
  cardOtpIpLimiter,
  cardOtpLimiter,
  validateRequest({ body: sendCardOtpSchema }),
  CardController.sendOtp
);

// Authenticated Student Card Routes
router.get("/me", authenticate, CardController.getCardDetails);

// Card Registration & Async Virtual GPR Issuance (API 2, API 4, API 5)
router.post(
  "/register-and-issue",
  authenticate,
  validateRequest({ body: registerAndIssueCardSchema }),
  CardController.registerAndIssue
);

// Standalone Card Provisioning for already registered customer (API 4 + API 5)
router.post("/issue-card", authenticate, CardController.issueCard);

// Full KYC URL (API 3)
router.post("/full-kyc-url", authenticate, CardController.getFullKycUrl);
router.get("/full-kyc-url", authenticate, CardController.getFullKycUrl);

// Full KYC Status Verification (API 3 dual-use)
router.get("/kyc-status", authenticate, CardController.checkKycStatus);

// In-app Full KYC Completion & Upgrade to ₹2,00,000 (API 3)
router.post(
  "/complete-kyc",
  authenticate,
  validateRequest({ body: completeFullKycSchema }),
  CardController.completeFullKyc
);

// Asynchronous Card Creation Status Polling (API 5)
router.get("/poll-status", authenticate, CardController.pollCardStatus);

// PCI-DSS Scoped Card SDK Session for Secure Card & PIN Views
router.get("/sdk-session", authenticate, CardController.getCardSdkSession);
router.post("/sdk-session", authenticate, CardController.getCardSdkSession);

// Load Money to Card (API 6 & API 7)
router.post(
  "/load",
  authenticate,
  validateRequest({ body: loadMoneySchema }),
  CardController.loadMoney
);

// Recent Card Transactions
router.get("/transactions", authenticate, CardController.getTransactions);

// Card Controls (Lock / Enable)
router.patch(
  "/controls",
  authenticate,
  validateRequest({ body: updateCardControlsSchema }),
  CardController.updateCardControls
);

export const cardRoutes = router;
