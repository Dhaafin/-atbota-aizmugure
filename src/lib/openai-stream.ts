import { openai, aiModel } from "./openai";

export async function createChatCompletionStream(
  messages: any[],
  onStreamComplete: (responseText: string) => Promise<void>
): Promise<Response> {
  const stream = await openai.chat.completions.create({
    model: aiModel,
    messages,
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
          await onStreamComplete(fullResponseText);
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
}
