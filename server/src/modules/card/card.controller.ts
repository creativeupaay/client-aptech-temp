import type { Request, Response, NextFunction } from "express";
import { CardService } from "./card.service.js";
import { sendResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import type {
  CompleteFullKycInput,
  LoadMoneyInput,
  RegisterAndIssueCardInput,
  SendCardOtpInput,
  UpdateCardControlsInput,
} from "./card.validation.js";

export class CardController {
  private static getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.id;
    if (!userId) {
      throw ApiError.unauthorized("Authentication required. Please log in.");
    }
    return userId;
  }

  public static async getCardDetails(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = CardController.getUserId(req);
      const card = await CardService.getCard(userId);
      sendResponse(res, {
        statusCode: 200,
        message: "Card details retrieved successfully",
        data: { card },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async sendOtp(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { mobile } = req.body as SendCardOtpInput;
      const result = await CardService.sendOtp(mobile);
      sendResponse(res, {
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async registerAndIssue(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = CardController.getUserId(req);
      const card = await CardService.registerAndIssue(
        userId,
        req.body as RegisterAndIssueCardInput
      );
      sendResponse(res, {
        statusCode: 200,
        message: "Card issued successfully",
        data: { card },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async issueCard(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = CardController.getUserId(req);
      const card = await CardService.issueCard(userId);
      sendResponse(res, {
        statusCode: 200,
        message: "Card provisioning initiated successfully",
        data: { card },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getFullKycUrl(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = CardController.getUserId(req);
      const result = await CardService.getFullKycUrl(userId);
      sendResponse(res, {
        statusCode: 200,
        message: "Full KYC URL generated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async completeFullKyc(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = CardController.getUserId(req);
      const card = await CardService.completeFullKyc(
        userId,
        req.body as CompleteFullKycInput
      );
      sendResponse(res, {
        statusCode: 200,
        message: "Full KYC verified successfully. Card limit upgraded to ₹2,00,000.",
        data: {
          card,
          newLimit: card.totalLimit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async checkKycStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = CardController.getUserId(req);
      const result = await CardService.checkKycStatus(userId);
      sendResponse(res, {
        statusCode: 200,
        message: result.message || "KYC status retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async pollCardStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = CardController.getUserId(req);
      const card = await CardService.pollCardStatus(userId);
      sendResponse(res, {
        statusCode: 200,
        message: card.status === "ACTIVE" ? "Card is active" : "Card provisioning in progress",
        data: { card },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getCardSdkSession(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = CardController.getUserId(req);
      const session = await CardService.getCardSdkSession(userId);
      sendResponse(res, {
        statusCode: 200,
        message: "Card SDK session initialized successfully",
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async loadMoney(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = CardController.getUserId(req);
      const idempotencyKey =
        (req.headers["idempotency-key"] as string) || req.body?.idempotencyKey;
      const { transaction, card } = await CardService.loadMoney(userId, {
        ...(req.body as LoadMoneyInput),
        idempotencyKey,
      });
      sendResponse(res, {
        statusCode: 200,
        message: "Money added to student card successfully",
        data: {
          transactionId: transaction.txnId,
          amount: transaction.amount,
          paymentMethod: transaction.paymentMethod,
          newBalance: card.availableBalance,
          card,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getTransactions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = CardController.getUserId(req);
      const transactions = await CardService.getTransactions(userId);
      sendResponse(res, {
        statusCode: 200,
        message: "Transactions retrieved successfully",
        data: { transactions },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateCardControls(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = CardController.getUserId(req);
      const card = await CardService.updateCardControls(
        userId,
        req.body as UpdateCardControlsInput
      );
      sendResponse(res, {
        statusCode: 200,
        message: "Card controls updated successfully",
        data: { card },
      });
    } catch (error) {
      next(error);
    }
  }
}
