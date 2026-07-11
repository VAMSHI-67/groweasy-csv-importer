import dotenv from "dotenv";
dotenv.config();

export interface EnvConfig {
  AI_PROVIDER: "gemini" | "groq" | "openai" | "mock";
  GEMINI_API_KEY: string;
  GROQ_API_KEY: string;
  OPENAI_API_KEY: string;
  API_PORT: number;
  NODE_ENV: string;
  AI_BATCH_SIZE: number;
  AI_CONCURRENCY: number;
  MAX_FILE_SIZE: number;
  MAX_ROWS: number;
}

function getEnvString(key: string, fallback: string = ""): string {
  return process.env[key] ?? fallback;
}

function getEnvNumber(key: string, fallback: number): number {
  const val = process.env[key];
  if (!val) return fallback;
  const num = parseInt(val, 10);
  return isNaN(num) ? fallback : num;
}

export const env: EnvConfig = {
  AI_PROVIDER: (getEnvString("AI_PROVIDER", "gemini") as EnvConfig["AI_PROVIDER"]),
  GEMINI_API_KEY: getEnvString("GEMINI_API_KEY"),
  GROQ_API_KEY: getEnvString("GROQ_API_KEY"),
  OPENAI_API_KEY: getEnvString("OPENAI_API_KEY"),
  API_PORT: getEnvNumber("API_PORT", 3001),
  NODE_ENV: getEnvString("NODE_ENV", "development"),
  AI_BATCH_SIZE: getEnvNumber("AI_BATCH_SIZE", 20),
  AI_CONCURRENCY: getEnvNumber("AI_CONCURRENCY", 3),
  MAX_FILE_SIZE: getEnvNumber("MAX_FILE_SIZE", 15_728_640),
  MAX_ROWS: getEnvNumber("MAX_ROWS", 5000),
};
