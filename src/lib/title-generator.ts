import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { openai, aiModel } from "./openai";

export async function generateAndSaveChatTitle(
  sessionId: string,
  userMessage: string,
  assistantResponse: string
) {
  try {
    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        {
          role: "system",
          content:
            "Berdasarkan dialog pertama antara User dan Assistant di bawah ini, buatlah satu judul percakapan singkat yang spesifik, relevan, dan representatif. Maksimal 3-4 kata dalam bahasa Indonesia. Jangan gunakan tanda kutip atau titik.",
        },
        {
          role: "user",
          content: `User: "${userMessage}"\nAssistant: "${assistantResponse}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 15,
    });

    const title =
      response.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, "") ||
      "Percakapan Baru";

    await db
      .update(sessions)
      .set({ title, updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  } catch (error) {
    console.error("Failed to generate chat title:", error);
  }
}
