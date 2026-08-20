import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { knowledge } from "@/db/schema";
import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

export async function POST(req: NextRequest) {
  try {
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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();

    const cleanedText = result.text.replace(/\s+/g, " ").trim();

    await db.delete(knowledge);

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
