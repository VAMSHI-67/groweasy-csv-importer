import type { AIProvider } from "./AIProvider";
import { GeminiProvider } from "./GeminiProvider";
import { GroqProvider } from "./GroqProvider";
import { OpenAIProvider } from "./OpenAIProvider";
import { MockAIProvider } from "./MockAIProvider";
import { env } from "../../config/env";

/**
 * Factory function that returns the correct AIProvider based on
 * the AI_PROVIDER environment variable.
 *
 * Supports: "gemini" (default), "groq", "openai", "mock"
 */
export function createAIProvider(): AIProvider {
  const provider = env.AI_PROVIDER;

  switch (provider) {
    case "gemini":
      return new GeminiProvider();
    case "groq":
      return new GroqProvider();
    case "openai":
      return new OpenAIProvider();
    case "mock":
      return new MockAIProvider();
    default:
      throw new Error(
        `Unknown AI_PROVIDER: "${provider}". Supported values: gemini, groq, openai, mock`
      );
  }
}
