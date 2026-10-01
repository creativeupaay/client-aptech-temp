import { Router } from "express";
import { HubbleController } from "./hubble.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import {
  hubbleLaunchLimiter,
  hubbleHistoryLimiter,
  hubbleCallbackLimiter,
} from "../../middlewares/rateLimiter.middleware.js";
import {
  ssoExchangeSchema,
  balanceQuerySchema,
  debitCoinsSchema,
  reverseDebitSchema,
  webhookTransactionSchema,
} from "./hubble.validation.js";

const router = Router();

// Base Integration status endpoint (for base URL verification)
router.get("/", (_req, res) => {
  res.status(200).json({
    status: "SUCCESS",
    success: true,
    message: "Hubble Money Integration Base API operational",
    endpoints: {
      sso: "/api/v1/hubble/sso",
      balance: "/api/v1/hubble/balance",
      debit: "/api/v1/hubble/debit",
      reverse: "/api/v1/hubble/reverse",
      webhook: "/api/v1/hubble/webhook/transaction-status",
    },
  });
});

// Hubble Client Configuration SSO (supports POST directly to Base URL /api/v1/hubble)
router.post(
  "/",
  hubbleCallbackLimiter,
  (req, res, next) => {
    if (req.body?.token || req.query?.token) {
      return HubbleController.classicSso(req, res);
    }
    return res.status(200).json({
      status: "SUCCESS",
      success: true,
      message: "Hubble Money Integration Base API operational",
      endpoints: {
        sso: "/api/v1/hubble/sso",
        balance: "/api/v1/hubble/balance",
        debit: "/api/v1/hubble/debit",
        reverse: "/api/v1/hubble/reverse",
        webhook: "/api/v1/hubble/webhook/transaction-status",
      },
    });
  }
);

// Student-facing authenticated endpoints (AP-Tech Client)
// Protected by JWT + In-Memory Rate Limiter (No Redis required)
router.post("/launch-url", authenticate, hubbleLaunchLimiter, HubbleController.getLaunchUrl);
router.get("/history", authenticate, hubbleHistoryLimiter, HubbleController.getHistory);

// Hubble-facing reverse callback endpoints (Hubble Integration Base URL)
// Protected by X-Hubble-Secret + In-Memory Rate Limiter

// 1. Classic SSO validation endpoint (supports token in body or query)
router.post(
  "/sso",
  hubbleCallbackLimiter,
  (req, res, next) => {
    if (req.query?.token) {
      return validateRequest({ query: ssoExchangeSchema })(req, res, next);
    }
    return validateRequest({ body: ssoExchangeSchema })(req, res, next);
  },
  HubbleController.classicSso
);
router.get(
  "/sso",
  hubbleCallbackLimiter,
  validateRequest({ query: ssoExchangeSchema }),
  HubbleController.classicSso
);

// 2. Coin Balance endpoint (supports both GET and POST)
router.post(
  "/balance",
  hubbleCallbackLimiter,
  validateRequest({ body: balanceQuerySchema }),
  HubbleController.getBalance
);
router.get(
  "/balance",
  hubbleCallbackLimiter,
  validateRequest({ query: balanceQuerySchema }),
  HubbleController.getBalance
);

// 3. Debit Coins endpoint
router.post(
  "/debit",
  hubbleCallbackLimiter,
  validateRequest({ body: debitCoinsSchema }),
  HubbleController.debitCoins
);

// 4. Reverse Debit / Rollback endpoint
router.post(
  "/reverse",
  hubbleCallbackLimiter,
  validateRequest({ body: reverseDebitSchema }),
  HubbleController.reverseDebit
);

// 5. Transaction Status Webhook
router.post(
  "/webhook/transaction-status",
  hubbleCallbackLimiter,
  validateRequest({ body: webhookTransactionSchema }),
  HubbleController.handleWebhook
);

export const hubbleRoutes = router;
