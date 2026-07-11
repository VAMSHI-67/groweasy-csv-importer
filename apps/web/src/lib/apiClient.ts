import type { ExtractionResult, ApiError } from "@groweasy/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Typed API client for the GrowEasy backend.
 * Supports AbortController for request cancellation.
 */

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * POST /api/csv/extract — Send parsed CSV rows for AI extraction.
 */
export async function extractCSV(
  headers: string[],
  rows: Record<string, unknown>[],
  signal?: AbortSignal
): Promise<ExtractionResult> {
  const response = await fetch(`${API_BASE}/api/csv/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ headers, rows }),
    signal,
  });

  if (!response.ok) {
    let errorData: ApiError | null = null;
    try {
      errorData = (await response.json()) as ApiError;
    } catch {
      // Response wasn't JSON
    }

    throw new ApiClientError(
      errorData?.error?.code ?? "UNKNOWN_ERROR",
      errorData?.error?.message ??
        `Request failed with status ${response.status}`,
      response.status
    );
  }

  return (await response.json()) as ExtractionResult;
}

/**
 * GET /api/health — Check backend health.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}
