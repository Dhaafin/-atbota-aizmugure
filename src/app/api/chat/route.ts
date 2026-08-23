import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateSession,
  insertMessage,
  fetchPDFContext,
  fetchChatHistory,
  fetchBotConfig,
} from "@/lib/db-helpers";
import { getPersonaStyle, buildSystemPrompt, embedQueryConstraints } from "@/lib/prompts";
import { createChatCompletionStream } from "@/lib/openai-stream";
import { generateAndSaveChatTitle } from "@/lib/title-generator";
import { updateSessionSummary } from "@/lib/session-summarizer";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, contactName, phoneNumber, metadata } = await req.json();

    if (!sessionId || !message) {
      return NextResponse.json({ error: "Session ID and message are required" }, { status: 400 });
    }

    // 1. Get session and insert user message
    const session = await getOrCreateSession(sessionId, contactName, phoneNumber, metadata);
    await insertMessage(sessionId, "user", message);

    // 2. Fetch data in parallel to maximize speed
    const [pdfText, history, config] = await Promise.all([
      fetchPDFContext(),
      fetchChatHistory(sessionId),
      fetchBotConfig(),
    ]);

    const isFirstExchange = history.length === 1;

    // 3. Format history array and clean initial turn turns
    let formattedMessages = history.map((msg) => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    }));

    if (formattedMessages.length > 0 && formattedMessages[0].role === "assistant") {
      formattedMessages = formattedMessages.slice(1);
    }

    // 4. Construct System Prompt & Embed Constraints
    const personaStyle = getPersonaStyle(config, isFirstExchange);
    const systemPrompt = buildSystemPrompt(config.botName, personaStyle, pdfText, session.summary);

    if (formattedMessages.length > 0) {
      const lastIdx = formattedMessages.length - 1;
      if (formattedMessages[lastIdx].role === "user") {
        formattedMessages[lastIdx].content = embedQueryConstraints(formattedMessages[lastIdx].content);
      }
    }

    // 5. Trigger Stream Completion & Handlers on Complete
    const payload = [
      { role: "system", content: systemPrompt },
      ...formattedMessages,
    ];

    return createChatCompletionStream(payload, async (responseText) => {
      // Save response message to database
      await insertMessage(sessionId, "assistant", responseText);

      // Trigger background tasks asynchronously
      if (isFirstExchange) {
        generateAndSaveChatTitle(sessionId, message, responseText).catch((err) =>
          console.error("Title generation background task error:", err)
        );
      } else {
        const totalMessages = history.length + 2;
        if (totalMessages >= 4 && totalMessages % 4 === 0) {
          updateSessionSummary(sessionId, session.summary, [
            ...formattedMessages,
            { role: "assistant", content: responseText },
          ]).catch((err) => console.error("Summary generation background task error:", err));
        }
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
