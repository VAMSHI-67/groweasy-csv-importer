/**
 * Retry service with exponential backoff for transient AI failures.
 *
 * Retries on: timeouts, rate limits (429), JSON parse failures.
 * Does NOT retry on: validation failures from genuinely bad input data.
 */

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 500;

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Default transient error detector.
 * Returns true for errors that are likely to succeed on retry.
 */
function isTransientError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Rate limiting
    if (message.includes("429") || message.includes("rate limit")) return true;

    // Timeout
    if (message.includes("timeout") || message.includes("timed out")) return true;

    // JSON parse failure (AI returned non-JSON — worth retrying)
    if (message.includes("json") && message.includes("parse")) return true;

    // Network errors
    if (
      message.includes("econnreset") ||
      message.includes("econnrefused") ||
      message.includes("fetch failed") ||
      message.includes("network")
    )
      return true;

    // 5xx server errors
    if (message.includes("500") || message.includes("502") || message.includes("503"))
      return true;
  }

  return false;
}

/**
 * Execute a function with exponential backoff retry logic.
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration
 * @returns The result of the function
 * @throws The last error if all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    shouldRetry = isTransientError,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Exponential backoff: 500ms, 1500ms, 4000ms
      const delay = baseDelayMs * Math.pow(3, attempt);
      console.warn(
        `[retry] Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delay}ms...`,
        error instanceof Error ? error.message : error
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
