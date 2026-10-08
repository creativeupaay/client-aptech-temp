import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env.config.js";
import { ApiError } from "../utils/ApiError.js";

export interface AuthUserPayload {
  id: string;
  mobile: string;
  userType: string;
  role?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // 1. Try reading HTTP-only cookie first
    let token = req.cookies?.accessToken;

    // 2. Fallback to Authorization: Bearer <token>
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      throw ApiError.unauthorized("Authentication required. Please log in.");
    }

    const secret = env.JWT_ACCESS_SECRET;
    const decoded = jwt.verify(token, secret) as AuthUserPayload;

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError(401, "Access token has expired. Please refresh session."));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized("Invalid authentication token."));
    } else {
      next(error);
    }
  }
};
