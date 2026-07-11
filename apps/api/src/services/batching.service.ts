import { env } from "../config/env";

/**
 * Splits an array of CSV rows into batches of a configured size.
 * Each batch is processed independently by the AI provider.
 *
 * Default batch size: 20 rows (configurable via AI_BATCH_SIZE env var).
 * This balances:
 * - Accuracy: smaller batches = less context confusion for the model
 * - Speed: larger batches = fewer API calls
 * - Cost: fewer API calls = fewer tokens used
 */
export function splitIntoBatches<T>(
  rows: T[],
  batchSize: number = env.AI_BATCH_SIZE
): T[][] {
  if (rows.length === 0) return [];

  const batches: T[][] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize));
  }
  return batches;
}
