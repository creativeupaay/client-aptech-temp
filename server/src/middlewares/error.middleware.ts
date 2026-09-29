import { type Request, type Response, type NextFunction } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../env.config.js";

interface MongoDuplicateKeyError {
  code: number;
  keyValue: Record<string, unknown>;
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: unknown = undefined;
  let isOperational = false;
  let stack = (err as Error)?.stack;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
    isOperational = err.isOperational;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation Error";
    errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    isOperational = true;
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    isOperational = true;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Database Validation Failed";
    errors = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message,
    }));
    isOperational = true;
  } else if (typeof err === "object" && err !== null && (err as MongoDuplicateKeyError).code === 11000) {
    statusCode = 409;
    const duplicateKey = Object.keys((err as MongoDuplicateKeyError).keyValue || {})[0] ?? "field";
    message = `Duplicate value entered for ${duplicateKey}. It must be unique.`;
    isOperational = true;
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (env.NODE_ENV !== "test") {
    if (!isOperational) {
      console.error("💥 [UNEXPECTED ERROR]:", err);
    } else if (env.NODE_ENV === "development") {
      console.warn(`⚠️ [${statusCode}] ${message}`);
    }
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational || env.NODE_ENV === "development" ? message : "Internal Server Error",
    ...(errors !== undefined && { errors }),
    ...(env.NODE_ENV === "development" && { stack }),
  });
};
