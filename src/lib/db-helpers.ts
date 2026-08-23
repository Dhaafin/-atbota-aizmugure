import { db } from "@/db";
import { sessions, messages, knowledge, botConfig } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export async function getOrCreateSession(
  sessionId: string,
  contactName?: string,
  phoneNumber?: string,
  metadata?: any
) {
  const existingSession = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (existingSession.length === 0) {
    const [newSession] = await db
      .insert(sessions)
      .values({
        id: sessionId,
        contactName: contactName || null,
        phoneNumber: phoneNumber || null,
        metadata: metadata || null,
      })
      .returning();
    return newSession;
  } else if (contactName || phoneNumber || metadata) {
    const [updatedSession] = await db
      .update(sessions)
      .set({
        contactName: contactName || existingSession[0].contactName,
        phoneNumber: phoneNumber || existingSession[0].phoneNumber,
        metadata: metadata
          ? { ...(existingSession[0].metadata as object || {}), ...metadata }
          : existingSession[0].metadata,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId))
      .returning();
    return updatedSession;
  }

  return existingSession[0];
}

export async function insertMessage(sessionId: string, role: "user" | "assistant" | "system", content: string) {
  return db.insert(messages).values({
    sessionId,
    role,
    content,
  });
}

export async function fetchPDFContext(): Promise<string> {
  const docs = await db
    .select()
    .from(knowledge)
    .orderBy(desc(knowledge.createdAt));
  return docs.map((d) => `Document: ${d.fileName}\n${d.pdfText}`).join("\n\n---\n\n");
}

export async function fetchChatHistory(sessionId: string, limit = 10) {
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  history.reverse();
  return history;
}

export async function fetchBotConfig() {
  const configs = await db.select().from(botConfig).limit(1);
  return configs[0] || {
    botName: "Asisten AI",
    persona: "friendly",
    welcomeMessage: "Halo! Ada yang bisa saya bantu hari ini?",
  };
}
