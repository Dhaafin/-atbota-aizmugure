export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Chatbot Backend API",
    version: "1.0.0",
    description: "API Docs for chatbot integration with static company RAG PDF",
  },
  security: [
    {
      ApiKeyAuth: [],
    },
  ],
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
      delete: {
        summary: "Delete company PDF",
        description: "Deletes a specific PDF document from the knowledge base using its ID",
        parameters: [
          {
            name: "id",
            in: "query",
            required: true,
            description: "ID of the document to delete",
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          200: {
            description: "Document deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                  },
                },
              },
            },
          },
          400: { description: "Missing document ID" },
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
    "/api/whatsapp/webhook": {
      get: {
        security: [],
        summary: "WhatsApp webhook verification",
        description: "Endpoint for Meta Graph API webhook token verification challenge",
        parameters: [
          {
            name: "hub.mode",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "hub.verify_token",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "hub.challenge",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Verification successful, returns challenge string",
            content: {
              "text/plain": {
                schema: { type: "string" },
              },
            },
          },
          403: { description: "Verification failed" },
        },
      },
      post: {
        security: [],
        summary: "WhatsApp event processor",
        description: "Receives messaging events from WhatsApp Cloud API, answers using RAG, and posts replies back",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                description: "Standard WhatsApp Webhook event payload schema",
              },
              example: {
                object: "whatsapp_business_account",
                entry: [
                  {
                    id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
                    changes: [
                      {
                        value: {
                          messaging_product: "whatsapp",
                          metadata: {
                            display_phone_number: "BOT_PHONE_NUMBER",
                            phone_number_id: "BOT_PHONE_NUMBER_ID",
                          },
                          contacts: [
                            {
                              profile: {
                                name: "SENDER_NAME",
                              },
                              wa_id: "SENDER_PHONE_NUMBER",
                            },
                          ],
                          messages: [
                            {
                              from: "SENDER_PHONE_NUMBER",
                              id: "MESSAGE_ID",
                              timestamp: "1672531199",
                              text: {
                                body: "MESSAGE_TEXT",
                              },
                              type: "text",
                            },
                          ],
                        },
                        field: "messages",
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Event acknowledged or ignored if non-text",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string" },
                  },
                },
              },
            },
          },
          400: { description: "Invalid payload structure" },
          500: { description: "Internal server error" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "Custom static API Key for Chatbot Backend access validation",
      },
    },
  },
};
