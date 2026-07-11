import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider } from "./AIProvider";
import type { ExtractionResult } from "@groweasy/shared";
import { getSystemPrompt } from "./prompts/systemPrompt";
import { getFewShotExamples } from "./prompts/fewShotExamples";
import { env } from "../../config/env";

/**
 * Google Gemini AI provider using the @google/generative-ai SDK.
 * Primary provider — generous free tier (15 RPM, 1M tokens/day).
 */
export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private client: GoogleGenerativeAI;

  constructor() {
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required when using the Gemini provider");
    }
    this.client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

  async extract(
    headers: string[],
    rows: Record<string, unknown>[]
  ): Promise<ExtractionResult> {
    const model = this.client.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: getSystemPrompt(),
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const fewShotExamples = getFewShotExamples();
    const fewShotMessages: { role: "user" | "model"; parts: { text: string }[] }[] = [];

    for (const example of fewShotExamples) {
      fewShotMessages.push({
        role: "user",
        parts: [{ text: example.input }],
      });
      fewShotMessages.push({
        role: "model",
        parts: [{ text: example.output }],
      });
    }

    const userMessage = JSON.stringify({ headers, rows });

    const chat = model.startChat({
      history: fewShotMessages,
    });

    const result = await chat.sendMessage(userMessage);
    const responseText = result.response.text();

    const parsed = JSON.parse(responseText) as ExtractionResult;
    return parsed;
  }
}
