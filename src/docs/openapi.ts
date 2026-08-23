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
      get: {
        summary: "List company PDFs",
        description: "Retrieves the list of uploaded PDF metadata, excluding the heavy pdfText content",
        responses: {
          200: {
            description: "Successfully retrieved list of documents",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      fileName: { type: "string" },
                      metadata: { type: "object" },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
          500: { description: "Internal server error" },
        },
      },
      patch: {
        summary: "Rename company PDF",
        description: "Updates the metadata file name for a PDF document",
        parameters: [
          {
            name: "id",
            in: "query",
            required: true,
            description: "ID of the document to rename",
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  fileName: {
                    type: "string",
                    description: "New name for the file",
                  },
                },
                required: ["fileName"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Document metadata updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    document: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        fileName: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Missing document ID or file name" },
          404: { description: "Document not found" },
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
    "/api/sessions": {
      get: {
        summary: "List chat sessions",
        description: "Retrieves a paginated list of chat sessions with their metadata and latest message",
        parameters: [
          {
            name: "search",
            in: "query",
            required: false,
            description: "Filter by contact name or phone number",
            schema: { type: "string" },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Number of records to return (max 100)",
            schema: { type: "integer", default: 20 },
          },
          {
            name: "offset",
            in: "query",
            required: false,
            description: "Number of records to skip",
            schema: { type: "integer", default: 0 },
          },
        ],
        responses: {
          200: {
            description: "Successfully retrieved sessions list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    sessions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          phoneNumber: { type: "string", nullable: true },
                          contactName: { type: "string", nullable: true },
                          createdAt: { type: "string", format: "date-time" },
                          updatedAt: { type: "string", format: "date-time" },
                          messageCount: { type: "integer" },
                          lastMessage: {
                            type: "object",
                            nullable: true,
                            properties: {
                              content: { type: "string" },
                              role: { type: "string" },
                              createdAt: { type: "string", format: "date-time" },
                            },
                          },
                        },
                      },
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        total: { type: "integer" },
                        limit: { type: "integer" },
                        offset: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
          500: { description: "Internal server error" },
        },
      },
    },
    "/api/sessions/{id}": {
      delete: {
        summary: "Delete chat session",
        description: "Deletes a specific chat session and all its messages",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "The session ID",
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "Session deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    deletedId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          400: { description: "Session ID is required" },
          404: { description: "Session not found" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/api/sessions/{id}/messages": {
      get: {
        summary: "Get session messages",
        description: "Retrieves all chat messages for a specific session ordered chronologically",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "The session ID",
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "Successfully retrieved messages list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    messages: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          sessionId: { type: "string", format: "uuid" },
                          role: { type: "string" },
                          content: { type: "string" },
                          createdAt: { type: "string", format: "date-time" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Session ID is required" },
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
