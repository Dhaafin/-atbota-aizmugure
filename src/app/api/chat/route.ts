import { NextRequest, NextResponse } from "next/server";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "@/db";
import { sessions, messages, knowledge } from "@/db/schema";
import { openai, aiModel } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, contactName, phoneNumber, metadata } = await req.json();

    if (!sessionId || !message) {
      return NextResponse.json({ error: "Session ID and message are required" }, { status: 400 });
    }

    const existingSession = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (existingSession.length === 0) {
      await db.insert(sessions).values({
        id: sessionId,
        contactName: contactName || null,
        phoneNumber: phoneNumber || null,
        metadata: metadata || null,
      });
    } else if (contactName || phoneNumber || metadata) {
      await db.update(sessions)
        .set({
          contactName: contactName || existingSession[0].contactName,
          phoneNumber: phoneNumber || existingSession[0].phoneNumber,
          metadata: metadata ? { ...(existingSession[0].metadata as object || {}), ...metadata } : existingSession[0].metadata,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, sessionId));
    }

    await db.insert(messages).values({
      sessionId,
      role: "user",
      content: message,
    });

    const docs = await db
      .select()
      .from(knowledge)
      .orderBy(desc(knowledge.createdAt));
    const pdfText = docs.map((d) => `Document: ${d.fileName}\n${d.pdfText}`).join("\n\n---\n\n");

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.createdAt))
      .limit(10);

    const formattedMessages = history.map((msg) => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    }));

    const systemPrompt = `You are a helpful customer support assistant. Answer questions based only on the following context. If you do not know the answer, say that you do not know.\n\nContext: ${pdfText}`;

    const stream = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        { role: "system", content: systemPrompt },
        ...formattedMessages,
      ],
      stream: true,
    });

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        let fullResponseText = "";
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullResponseText += content;
              controller.enqueue(encoder.encode(content));
            }
          }
          if (fullResponseText) {
            await db.insert(messages).values({
              sessionId,
              role: "assistant",
              content: fullResponseText,
            });
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
