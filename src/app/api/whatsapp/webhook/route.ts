import { NextRequest, NextResponse } from "next/server";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "@/db";
import { sessions, messages, knowledge } from "@/db/schema";
import { openai, aiModel } from "@/lib/openai";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messageObj = value?.messages?.[0];
    const contactObj = value?.contacts?.[0];
    const metadata = value?.metadata;

    if (!messageObj || messageObj.type !== "text") {
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const sender = messageObj.from;
    const messageText = messageObj.text?.body;
    const phoneId = metadata?.phone_number_id;
    const contactName = contactObj?.profile?.name;

    if (!sender || !messageText || !phoneId) {
      return NextResponse.json({ error: "Invalid payload structure" }, { status: 400 });
    }

    const existingSession = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sender))
      .limit(1);

    if (existingSession.length === 0) {
      await db.insert(sessions).values({
        id: sender,
        phoneNumber: sender,
        contactName: contactName || null,
      });
    }

    await db.insert(messages).values({
      sessionId: sender,
      role: "user",
      content: messageText,
    });

    const docs = await db
      .select()
      .from(knowledge)
      .orderBy(desc(knowledge.createdAt))
      .limit(1);
    const pdfText = docs[0]?.pdfText || "";

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sender))
      .orderBy(asc(messages.createdAt))
      .limit(10);

    const formattedMessages = history.map((msg) => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    }));

    const systemPrompt = `You are a helpful customer support assistant. Answer questions based only on the following context. If you do not know the answer, say that you do not know.\n\nContext: ${pdfText}`;

    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        { role: "system", content: systemPrompt },
        ...formattedMessages,
      ],
    });

    const replyText = response.choices[0]?.message?.content || "";

    if (replyText) {
      await db.insert(messages).values({
        sessionId: sender,
        role: "assistant",
        content: replyText,
      });

      const waResponse = await fetch(
        `https://graph.facebook.com/v20.0/${phoneId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: sender,
            type: "text",
            text: {
              preview_url: false,
              body: replyText,
            },
          }),
        }
      );

      if (!waResponse.ok) {
        const errText = await waResponse.text();
        console.error("Meta API error:", errText);
      }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
