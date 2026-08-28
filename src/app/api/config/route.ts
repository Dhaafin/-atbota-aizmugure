import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { botConfig } from "@/db/schema";

const DEFAULT_CONFIG = {
  botName: "Asisten AI",
  persona: "friendly",
  welcomeMessage: "Halo! Ada yang bisa saya bantu hari ini?",
  suggestions: [
    "Layanan TCU apa saja?",
    "Alamat TCU di mana?",
    "Jam operasional?",
    "Biaya konseling?",
    "Saya mau daftar layanan"
  ],
};

export async function GET(req: NextRequest) {
  try {
    const configs = await db.select().from(botConfig).limit(1);
    
    if (configs.length === 0) {
      return NextResponse.json(DEFAULT_CONFIG);
    }
    
    return NextResponse.json(configs[0]);
  } catch (err: any) {
    console.error("GET /api/config error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { botName, persona, welcomeMessage, suggestions } = body;

    if (!botName || !persona || !welcomeMessage) {
      return NextResponse.json(
        { error: "botName, persona, and welcomeMessage are required fields." },
        { status: 400 }
      );
    }

    const trimmedPersona = persona.trim();
    if (trimmedPersona !== "friendly" && trimmedPersona !== "professional") {
      return NextResponse.json(
        { error: "Persona harus berupa 'friendly' atau 'professional'." },
        { status: 400 }
      );
    }

    // Security Input Validation for suggestions
    if (suggestions !== undefined) {
      if (!Array.isArray(suggestions)) {
        return NextResponse.json(
          { error: "Properti suggestions harus berupa Array." },
          { status: 400 }
        );
      }
      if (suggestions.length > 20) {
        return NextResponse.json(
          { error: "Saran pertanyaan maksimal berisi 20 item." },
          { status: 400 }
        );
      }
      const isValid = suggestions.every(
        (item) =>
          typeof item === "string" &&
          item.trim().length > 0 &&
          item.trim().length <= 100
      );
      if (!isValid) {
        return NextResponse.json(
          { error: "Setiap item saran harus berupa teks non-kosong maksimal 100 karakter." },
          { status: 400 }
        );
      }
    }

    const configs = await db.select().from(botConfig).limit(1);

    const suggestionsData = suggestions !== undefined 
      ? suggestions.map((item: string) => item.trim())
      : DEFAULT_CONFIG.suggestions;

    if (configs.length > 0) {
      const [updated] = await db
        .update(botConfig)
        .set({
          botName: botName.trim(),
          persona: trimmedPersona,
          welcomeMessage: welcomeMessage.trim(),
          suggestions: suggestionsData,
          updatedAt: new Date(),
        })
        .where(eq(botConfig.id, configs[0].id))
        .returning();

      return NextResponse.json(updated);
    } else {
      const [inserted] = await db
        .insert(botConfig)
        .values({
          botName: botName.trim(),
          persona: trimmedPersona,
          welcomeMessage: welcomeMessage.trim(),
          suggestions: suggestionsData,
        })
        .returning();

      return NextResponse.json(inserted);
    }
  } catch (err: any) {
    console.error("POST /api/config error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
