import type { Request, Response, NextFunction } from "express";

export interface AppError {
  code: string;
  message: string;
  statusCode: number;
}

export function createAppError(
  code: string,
  message: string,
  statusCode: number = 500
): AppError & Error {
  const error = new Error(message) as AppError & Error;
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

export function errorHandler(
  err: Error & Partial<AppError>,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? "INTERNAL_ERROR";
  const message = err.message || "An unexpected error occurred";

  console.error(`[ERROR] ${code}: ${message}`, err.stack);

  res.status(statusCode).json({
    error: { code, message },
  });
}
