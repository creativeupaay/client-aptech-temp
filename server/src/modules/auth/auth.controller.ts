import { type Request, type Response, type NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import { sendResponse } from "../../utils/apiResponse.js";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import type {
  SsoExchangeInput,
  SimulateSsoCodeInput,
} from "./auth.validation.js";

export class AuthController {
  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      const result = await AuthService.refreshSession(refreshToken);
      // Set updated cookies
      AuthService.setAuthCookies(res, result.tokens);

      sendResponse(res, {
        statusCode: 200,
        message: "Session refreshed successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      AuthService.clearAuthCookies(res);
      sendResponse(res, {
        statusCode: 200,
        message: "Logged out successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.getMe(req.user!.id);
      sendResponse(res, {
        statusCode: 200,
        message: "Profile retrieved successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async ssoExchange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.body as SsoExchangeInput;
      const result = await AuthService.exchangeProconnectCode(code);
      // Set secure HTTP-only cookies
      AuthService.setAuthCookies(res, result.tokens);

      sendResponse(res, {
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async simulateSsoCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.simulateProconnectCode(req.body as SimulateSsoCodeInput);
      sendResponse(res, {
        statusCode: 200,
        message: "Simulated ProConnect authorization code generated.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
