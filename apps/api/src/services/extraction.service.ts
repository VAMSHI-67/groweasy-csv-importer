import type { ExtractionResult, CrmRecord, SkippedRow } from "@groweasy/shared";
import type { AIProvider } from "./ai/AIProvider";
import { createAIProvider } from "./ai/providerFactory";
import { splitIntoBatches } from "./batching.service";
import { validateExtractionResult } from "./validation.service";
import { withRetry } from "./retry.service";
import { env } from "../config/env";

/**
 * Main extraction orchestrator.
 * Coordinates: batch splitting → AI extraction → validation → merge
 *
 * Uses bounded concurrency (p-limit) to respect provider rate limits
 * while still processing batches in parallel.
 */

interface BatchProgress {
  batchIndex: number;
  totalBatches: number;
  status: "processing" | "completed" | "failed";
}

type ProgressCallback = (progress: BatchProgress) => void;

export class ExtractionService {
  private provider: AIProvider;

  constructor(provider?: AIProvider) {
    this.provider = provider ?? createAIProvider();
  }

  /**
   * Extract CRM records from raw CSV rows using AI.
   *
   * @param headers - CSV column headers
   * @param rows - Array of raw row objects
   * @param onProgress - Optional callback for batch progress reporting
   * @returns Validated extraction result
   */
  async extract(
    headers: string[],
    rows: Record<string, unknown>[],
    onProgress?: ProgressCallback
  ): Promise<ExtractionResult> {
    const totalInputRows = rows.length;
    const batches = splitIntoBatches(rows);
    const totalBatches = batches.length;

    console.log(
      `[extraction] Starting extraction: ${totalInputRows} rows in ${totalBatches} batches ` +
        `(batch size: ${env.AI_BATCH_SIZE}, concurrency: ${env.AI_CONCURRENCY}, provider: ${this.provider.name})`
    );

    // Dynamic import for p-limit (ESM-only package)
    const pLimit = (await import("p-limit")).default;
    const limit = pLimit(env.AI_CONCURRENCY);

    const batchResults: ExtractionResult[] = [];
    const batchErrors: { batchIndex: number; error: string }[] = [];

    const tasks = batches.map((batch, index) =>
      limit(async () => {
        onProgress?.({
          batchIndex: index,
          totalBatches,
          status: "processing",
        });

        try {
          const result = await withRetry(() =>
            this.provider.extract(headers, batch)
          );

          onProgress?.({
            batchIndex: index,
            totalBatches,
            status: "completed",
          });

          return result;
        } catch (error) {
          console.error(
            `[extraction] Batch ${index + 1}/${totalBatches} failed permanently:`,
            error instanceof Error ? error.message : error
          );

          onProgress?.({
            batchIndex: index,
            totalBatches,
            status: "failed",
          });

          batchErrors.push({
            batchIndex: index,
            error: error instanceof Error ? error.message : String(error),
          });

          // Return a result with all rows in this batch marked as skipped
          return {
            imported: [],
            skipped: batch.map((row) => ({
              original_row: row,
              reason: `AI processing failed: ${error instanceof Error ? error.message : "unknown error"}`,
            })),
            total_input_rows: batch.length,
            total_imported: 0,
            total_skipped: batch.length,
          } satisfies ExtractionResult;
        }
      })
    );

    const results = await Promise.all(tasks);

    // Merge all batch results
    const merged = this.mergeResults(results, totalInputRows);

    // Apply deterministic validation guardrails
    const validated = validateExtractionResult(merged);

    console.log(
      `[extraction] Complete: ${validated.total_imported} imported, ${validated.total_skipped} skipped` +
        (batchErrors.length > 0
          ? ` (${batchErrors.length} batch(es) failed)`
          : "")
    );

    return validated;
  }

  /**
   * Merge multiple batch results into a single ExtractionResult.
   */
  private mergeResults(
    results: ExtractionResult[],
    totalInputRows: number
  ): ExtractionResult {
    const allImported: CrmRecord[] = [];
    const allSkipped: SkippedRow[] = [];

    for (const result of results) {
      allImported.push(...(result.imported ?? []));
      allSkipped.push(...(result.skipped ?? []));
    }

    return {
      imported: allImported,
      skipped: allSkipped,
      total_input_rows: totalInputRows,
      total_imported: allImported.length,
      total_skipped: allSkipped.length,
    };
  }
}
