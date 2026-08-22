import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { knowledge } from "@/db/schema";
import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const { fileName, text } = await req.json();

      if (!fileName || !text) {
        return NextResponse.json({ error: "fileName and text are required" }, { status: 400 });
      }

      const existingDocs = await db.select({ id: knowledge.id }).from(knowledge);
      if (existingDocs.length >= 5) {
        return NextResponse.json({ error: "Maximum limit of 5 documents reached" }, { status: 400 });
      }

      const [newDoc] = await db
        .insert(knowledge)
        .values({
          fileName: fileName.trim(),
          pdfText: text.trim(),
          metadata: {
            size: Buffer.byteLength(text),
            type: "text/plain",
            source: "direct_input",
            uploadedAt: new Date().toISOString(),
          },
        })
        .returning();

      return NextResponse.json(
        {
          success: true,
          id: newDoc.id,
          fileName: newDoc.fileName,
        },
        { status: 200 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 4MB limit" }, { status: 413 });
    }

    const existingDocs = await db.select({ id: knowledge.id }).from(knowledge);
    if (existingDocs.length >= 5) {
      return NextResponse.json({ error: "Maximum limit of 5 documents reached" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();

    const cleanedText = result.text.replace(/\s+/g, " ").trim();

    const [newDoc] = await db
      .insert(knowledge)
      .values({
        fileName: file.name,
        pdfText: cleanedText,
        metadata: {
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        },
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        id: newDoc.id,
        fileName: newDoc.fileName,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing document ID" }, { status: 400 });
    }

    await db.delete(knowledge).where(eq(knowledge.id, id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const docs = await db.select({
      id: knowledge.id,
      fileName: knowledge.fileName,
      metadata: knowledge.metadata,
      createdAt: knowledge.createdAt,
      updatedAt: knowledge.updatedAt,
    }).from(knowledge);

    return NextResponse.json(docs, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing document ID" }, { status: 400 });
    }

    const { fileName } = await req.json();
    if (!fileName) {
      return NextResponse.json({ error: "Missing new file name" }, { status: 400 });
    }

    const [updatedDoc] = await db
      .update(knowledge)
      .set({ 
        fileName,
        updatedAt: new Date(),
      })
      .where(eq(knowledge.id, id))
      .returning({
        id: knowledge.id,
        fileName: knowledge.fileName,
      });

    if (!updatedDoc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, document: updatedDoc }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

