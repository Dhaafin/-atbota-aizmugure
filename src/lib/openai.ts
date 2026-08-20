import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const globalForOpenAI = global as unknown as { openai: OpenAI };

export const openai =
  globalForOpenAI.openai ||
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForOpenAI.openai = openai;
}

export const aiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
