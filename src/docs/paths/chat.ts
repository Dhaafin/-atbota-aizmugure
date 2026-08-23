export const chatPaths = {
  "/api/chat": {
    post: {
      summary: "Chat completion stream",
      description: "Streams chatbot responses word-by-word (SSE) using static PDF context and session chat history",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                sessionId: {
                  type: "string",
                  description: "Session identifier (UUID or phone number)",
                },
                message: {
                  type: "string",
                  description: "User input prompt",
                },
                contactName: {
                  type: "string",
                  description: "Optional contact display name for session registration",
                },
                phoneNumber: {
                  type: "string",
                  description: "Optional phone number for session registration",
                },
                metadata: {
                  type: "object",
                  description: "Optional custom key-value metadata for classifying the session (e.g. source channel)",
                },
              },
              required: ["sessionId", "message"],
            },
          },
        },
      },
      responses: {
        200: {
          description: "Streaming response chunks of plaintext text/plain",
          content: {
            "text/plain": {
              schema: {
                type: "string",
                description: "Raw text stream chunk",
              },
            },
          },
        },
        400: { description: "Missing sessionId or message" },
        500: { description: "Internal server error" },
      },
    },
  },
};
