import { NextResponse } from "next/server";

export async function GET() {
  const openApiSpec = {
    openapi: "3.0.0",
    info: {
      title: "Chatbot Backend API",
      version: "1.0.0",
      description: "API Docs for chatbot integration with static company RAG PDF",
    },
    paths: {
      "/api/upload": {
        post: {
          summary: "Upload company PDF",
          description: "Receives a PDF document upload, extracts its text, and saves it in the knowledge table",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    file: {
                      type: "string",
                      format: "binary",
                      description: "Company PDF file (maximum 4MB)",
                    },
                  },
                  required: ["file"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "PDF upload and extraction successful",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      id: { type: "string", format: "uuid" },
                      fileName: { type: "string" },
                    },
                  },
                },
              },
            },
            400: { description: "Invalid file format or empty payload" },
            413: { description: "File size exceeds 4MB limit" },
            500: { description: "Internal server error" },
          },
        },
      },
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
    },
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>API Reference</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            margin: 0;
          }
        </style>
      </head>
      <body>
        <script
          id="api-reference"
          data-url="data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(openApiSpec))}">
        </script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
