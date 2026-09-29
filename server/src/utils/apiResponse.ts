import { type Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponseOptions<T> {
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
}

export const sendResponse = <T>(
  res: Response,
  { statusCode = 200, message, data, meta }: ApiResponseOptions<T>
): void => {
  res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
    ...(meta && { meta }),
  });
};
