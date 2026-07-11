import type { ExtractionResult } from "@groweasy/shared";

/**
 * Abstract interface for AI providers.
 * Each provider takes raw CSV rows + headers and returns
 * structured CRM extraction results.
 */
export interface AIProvider {
  readonly name: string;

  /**
   * Send a batch of raw CSV rows to the AI model and get back
   * structured CRM records + skipped rows.
   *
   * @param headers - The original CSV column headers
   * @param rows    - Array of flat row objects (header -> value)
   * @returns Extraction result with imported records and skipped rows
   */
  extract(
    headers: string[],
    rows: Record<string, unknown>[]
  ): Promise<ExtractionResult>;
}
