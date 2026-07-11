import Groq from "groq-sdk";
import type { AIProvider } from "./AIProvider";
import type { ExtractionResult } from "@groweasy/shared";
import { getSystemPrompt } from "./prompts/systemPrompt";
import { getFewShotExamples } from "./prompts/fewShotExamples";
import { env } from "../../config/env";

/**
 * Groq AI provider using Llama 3.3 70B.
 * Free tier with extremely fast inference.
 */
export class GroqProvider implements AIProvider {
  readonly name = "groq";
  private client: Groq;

  constructor() {
    if (!env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is required when using the Groq provider");
    }
    this.client = new Groq({ apiKey: env.GROQ_API_KEY });
  }

  async extract(
    headers: string[],
    rows: Record<string, unknown>[]
  ): Promise<ExtractionResult> {
    try {
      return await this.extractWithModel("llama-3.3-70b-versatile", headers, rows);
    } catch (err: any) {
      const errMsg = String(err.message || err);
      if (
        errMsg.includes("429") ||
        errMsg.includes("413") ||
        errMsg.includes("rate_limit_exceeded") ||
        errMsg.includes("limit") ||
        errMsg.includes("Quota") ||
        errMsg.includes("quota")
      ) {
        console.warn(`[GroqProvider] llama-3.3-70b-versatile rate limit or token limit hit. Falling back to llama-3.1-8b-instant...`);
        return await this.extractWithModel("llama-3.1-8b-instant", headers, rows);
      }
      throw err;
    }
  }

  private async extractWithModel(
    modelName: string,
    headers: string[],
    rows: Record<string, unknown>[]
  ): Promise<ExtractionResult> {
    const fewShotExamples = getFewShotExamples();
    const fewShotMessages: Groq.Chat.ChatCompletionMessageParam[] = [];

    for (const example of fewShotExamples) {
      fewShotMessages.push({ role: "user", content: example.input });
      fewShotMessages.push({ role: "assistant", content: example.output });
    }

    const userMessage = JSON.stringify({ headers, rows });

    const completion = await this.client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: getSystemPrompt() },
        ...fewShotMessages,
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 8192,
    });

    const responseText = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(responseText) as ExtractionResult;
    return parsed;
  }
}
