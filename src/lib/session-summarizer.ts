import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { openai, aiModel } from "./openai";

export async function updateSessionSummary(
  sessionId: string,
  currentSummary: string | null,
  recentMessages: { role: string; content: string }[]
) {
  try {
    const formattedHistory = recentMessages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const prompt = `Berikut adalah riwayat percakapan terbaru antara User dan Assistant beserta Rangkuman lama (jika ada).
Tugas Anda adalah membuat atau memperbarui Rangkuman obrolan menjadi satu ringkasan yang padat, singkat (maksimal 2-3 kalimat), dan memuat informasi krusial seperti:
- Nama pengguna atau asal instansi (jika disebutkan).
- Topik utama yang ditanyakan atau kepentingan utama pengguna.
- Informasi spesifik yang sudah disepakati atau diinformasikan (seperti tarif, syarat, dsb).

Rangkuman Lama:
"${currentSummary || "Belum ada rangkuman sebelumnya."}"

Riwayat Baru:
${formattedHistory}

Buatlah Rangkuman baru yang diperbarui secara padat dan faktual dalam bahasa Indonesia. Jangan mengarang informasi.`;

    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        {
          role: "system",
          content: "Anda adalah asisten data yang bertugas merangkum intisari percakapan secara padat dan faktual.",
        },
        {
          role: "user",
          content: prompt,
            },
          ],
          temperature: 0.2,
      max_tokens: 150,
        });

    const newSummary = response.choices[0]?.message?.content?.trim() || currentSummary;

    if (newSummary) {
      await db
        .update(sessions)
        .set({ summary: newSummary, updatedAt: new Date() })
        .where(eq(sessions.id, sessionId));
    }
  } catch (error) {
    console.error("Failed to update session summary:", error);
  }
}
