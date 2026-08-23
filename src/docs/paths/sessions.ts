export const sessionsPaths = {
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
          500: { description: "Internal server error" },
        },
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
};
