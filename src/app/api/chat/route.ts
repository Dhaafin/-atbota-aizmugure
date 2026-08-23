import { NextRequest, NextResponse } from "next/server";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "@/db";
import { sessions, messages, knowledge, botConfig } from "@/db/schema";
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

    let formattedMessages = history.map((msg) => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    }));

    if (formattedMessages.length > 0 && formattedMessages[0].role === "assistant") {
      formattedMessages = formattedMessages.slice(1);
    }

    const configs = await db.select().from(botConfig).limit(1);
    const config = configs[0] || {
      botName: "Asisten AI",
      persona: "friendly",
      welcomeMessage: "Halo! Ada yang bisa saya bantu hari ini?",
    };

    const personaStyle = config.persona === "friendly"
      ? "Gunakan nada bicara yang ramah, hangat, empatis, dan membantu."
      : "Gunakan nada bicara yang formal, profesional, jelas, dan lugas.";

    const systemPrompt = `Nama Anda adalah ${config.botName}. Anda adalah asisten AI layanan pelanggan resmi untuk biro TCU.

Gaya Komunikasi: ${personaStyle}

Aturan Identitas:
- Jika pengguna bertanya tentang siapa pembuat Anda, katakan bahwa Anda dikembangkan oleh tim IT internal TCU.
- DILARANG menyebutkan kata "OpenAI", "ChatGPT", atau "GPT-4" dalam situasi apa pun. Jika ditanya mengenai model dasar, jawablah secara diplomatis bahwa Anda adalah asisten AI khusus TCU.

Aturan RAG:
- Jawab pertanyaan pengguna HANYA berdasarkan konteks dokumen di bawah ini.
- Harap membaca konteks dokumen dengan sangat teliti. Bedakan setiap entitas/nama staf (misalnya Direktur, Wakil Direktur, Asesor, Staff Administrasi) dengan jelas. Jangan mencampuradukkan profil, kualifikasi, atau latar belakang satu orang dengan orang lain.
- Cari secara spesifik topik atau entitas yang ditanyakan pada pesan terbaru pengguna.
- Jika Anda tidak mengetahui jawabannya dari dokumen, katakan secara sopan bahwa Anda tidak tahu. Jangan pernah berhalusinasi atau mengarang informasi.

Context:
${pdfText}`;

    const stream = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        { role: "system", content: systemPrompt },
        ...formattedMessages,
        {
          role: "system" as const,
          content: "PENTING: Jawablah pertanyaan terbaru di atas secara spesifik HANYA berdasarkan konteks dokumen. Jangan mengulangi jawaban asisten sebelumnya jika topiknya berbeda. Jika tidak ada informasi tentang entitas yang ditanyakan, katakan secara sopan bahwa Anda tidak tahu.",
        },
      ],
      temperature: 0.1,
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
