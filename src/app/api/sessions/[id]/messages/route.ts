import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { messages } from "@/db/schema";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, id))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json({ messages: chatMessages });
  } catch (error) {
    console.error(`GET /api/sessions/${req.url}/messages error:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
