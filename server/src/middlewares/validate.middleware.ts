import { type Request, type Response, type NextFunction } from "express";
import { type ZodTypeAny, ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

export interface RequestValidationSchema {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export const validateRequest = (schemas: RequestValidationSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        const parsedQuery = await schemas.query.parseAsync(req.query);
        try {
          Object.defineProperty(req, "query", {
            value: parsedQuery,
            writable: true,
            configurable: true,
            enumerable: true,
          });
        } catch {
          Object.assign(req.query, parsedQuery);
        }
      }
      if (schemas.params) {
        const parsedParams = await schemas.params.parseAsync(req.params);
        try {
          Object.defineProperty(req, "params", {
            value: parsedParams,
            writable: true,
            configurable: true,
            enumerable: true,
          });
        } catch {
          Object.assign(req.params, parsedParams);
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        next(new ApiError(400, "Validation failed", formattedErrors));
      } else {
        next(error);
      }
    }
  };
};
