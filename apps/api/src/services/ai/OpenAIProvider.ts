import OpenAI from "openai";
import type { AIProvider } from "./AIProvider";
import type { ExtractionResult } from "@groweasy/shared";
import { getSystemPrompt } from "./prompts/systemPrompt";
import { getFewShotExamples } from "./prompts/fewShotExamples";
import { env } from "../../config/env";

/**
 * OpenAI provider using GPT-4o-mini.
 * Requires a paid API key.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private client: OpenAI;

  constructor() {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required when using the OpenAI provider");
    }
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  async extract(
    headers: string[],
    rows: Record<string, unknown>[]
  ): Promise<ExtractionResult> {
    const fewShotExamples = getFewShotExamples();
    const fewShotMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    for (const example of fewShotExamples) {
      fewShotMessages.push({ role: "user", content: example.input });
      fewShotMessages.push({ role: "assistant", content: example.output });
    }

    const userMessage = JSON.stringify({ headers, rows });

    const completion = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
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
