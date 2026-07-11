import type { Request, Response, NextFunction } from "express";
import { ExtractRequestSchema } from "@groweasy/shared";
import { ExtractionService } from "../services/extraction.service";
import { createAppError } from "../middleware/errorHandler";
import { env } from "../config/env";

const extractionService = new ExtractionService();

/**
 * Controller for POST /api/csv/extract
 * Thin layer: validate request → call service → format response
 */
export async function extractController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Validate request body shape
    const parseResult = ExtractRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw createAppError(
        "INVALID_REQUEST",
        `Invalid request body: ${parseResult.error.issues.map((i) => i.message).join(", ")}`,
        400
      );
    }

    const { headers, rows } = parseResult.data;

    // 2. Enforce max rows limit
    if (rows.length > env.MAX_ROWS) {
      throw createAppError(
        "PAYLOAD_TOO_LARGE",
        `Too many rows: ${rows.length}. Maximum allowed is ${env.MAX_ROWS}. Please split your CSV and submit in smaller batches.`,
        413
      );
    }

    // 3. Call extraction service
    const result = await extractionService.extract(headers, rows);

    // 4. Return result
    res.json(result);
  } catch (error) {
    // Distinguish AI provider errors from other errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (
        message.includes("timeout") ||
        message.includes("timed out")
      ) {
        next(
          createAppError(
            "AI_PROVIDER_TIMEOUT",
            "AI provider timed out. Please retry in a few moments.",
            504
          )
        );
        return;
      }
      if (
        message.includes("rate limit") ||
        message.includes("429")
      ) {
        next(
          createAppError(
            "AI_RATE_LIMITED",
            "AI provider rate limit reached. Please wait and retry.",
            502
          )
        );
        return;
      }
    }
    next(error);
  }
}
