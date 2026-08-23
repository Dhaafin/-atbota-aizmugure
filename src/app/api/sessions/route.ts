import { NextRequest, NextResponse } from "next/server";
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { sessions, messages } from "@/db/schema";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search") || "";
    let limit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);
    let offset = parseInt(req.nextUrl.searchParams.get("offset") || "0", 10);

    if (isNaN(limit) || limit <= 0) limit = 20;
    if (limit > 100) limit = 100;
    if (isNaN(offset) || offset < 0) offset = 0;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(sessions.contactName, `%${search}%`),
          ilike(sessions.phoneNumber, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Subquery to get the latest message per session
    const latestMessagesSubquery = db
      .select({
        sessionId: messages.sessionId,
        content: messages.content,
        role: messages.role,
        createdAt: messages.createdAt,
        rowNumber: sql`row_number() over (partition by ${messages.sessionId} order by ${messages.createdAt} desc)`.as("row_num")
      })
      .from(messages)
      .as("lm");

    // Subquery to count messages per session
    const messageCountsSubquery = db
      .select({
        sessionId: messages.sessionId,
        count: sql<number>`count(${messages.id})::int`.as("count")
      })
      .from(messages)
      .groupBy(messages.sessionId)
      .as("mc");

    // Execute paginated listing with joins
    const sessionsList = await db
      .select({
        id: sessions.id,
        title: sessions.title,
        phoneNumber: sessions.phoneNumber,
        contactName: sessions.contactName,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
        messageCount: sql<number>`coalesce(${messageCountsSubquery.count}, 0)`,
        lastMessageContent: latestMessagesSubquery.content,
        lastMessageRole: latestMessagesSubquery.role,
        lastMessageCreatedAt: latestMessagesSubquery.createdAt,
      })
      .from(sessions)
      .leftJoin(messageCountsSubquery, eq(sessions.id, messageCountsSubquery.sessionId))
      .leftJoin(latestMessagesSubquery, and(
        eq(sessions.id, latestMessagesSubquery.sessionId),
        eq(latestMessagesSubquery.rowNumber, 1)
      ))
      .where(whereClause)
      .orderBy(desc(sql`coalesce(${latestMessagesSubquery.createdAt}, ${sessions.createdAt})`))
      .limit(limit)
      .offset(offset);

    // Get total matching sessions count
    const [countResult] = await db
      .select({ count: sql<number>`count(${sessions.id})::int` })
      .from(sessions)
      .where(whereClause);

    const formattedSessions = sessionsList.map((row) => ({
      id: row.id,
      title: row.title,
      phoneNumber: row.phoneNumber,
      contactName: row.contactName,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      messageCount: row.messageCount,
      lastMessage: row.lastMessageContent ? {
        content: row.lastMessageContent,
        role: row.lastMessageRole,
        createdAt: row.lastMessageCreatedAt,
      } : null,
    }));

    return NextResponse.json({
      sessions: formattedSessions,
      pagination: {
        total: countResult?.count || 0,
        limit,
        offset,
      }
    });
  } catch (error) {
    console.error("GET /api/sessions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
