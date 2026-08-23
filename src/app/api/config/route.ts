import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { botConfig } from "@/db/schema";

const DEFAULT_CONFIG = {
  botName: "Asisten AI",
  persona: "friendly",
  welcomeMessage: "Halo! Ada yang bisa saya bantu hari ini?",
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
    const { botName, persona, welcomeMessage } = body;

    if (!botName || !persona || !welcomeMessage) {
      return NextResponse.json(
        { error: "botName, persona, and welcomeMessage are required fields." },
        { status: 400 }
      );
    }

    const configs = await db.select().from(botConfig).limit(1);

    if (configs.length > 0) {
      const [updated] = await db
        .update(botConfig)
        .set({
          botName: botName.trim(),
          persona: persona.trim(),
          welcomeMessage: welcomeMessage.trim(),
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
          persona: persona.trim(),
          welcomeMessage: welcomeMessage.trim(),
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
