export const configPaths = {
  "/api/config": {
    get: {
      summary: "Get chatbot configuration",
      description: "Retrieves the current dynamic settings for the chatbot (display name, persona tone, and initial greeting message)",
      responses: {
        200: {
          description: "Successful response containing configuration settings",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  botName: { type: "string" },
                  persona: { type: "string", enum: ["friendly", "professional"] },
                  welcomeMessage: { type: "string" },
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of dynamic chat suggestion questions"
                  },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        500: { description: "Internal server error" },
      },
    },
    post: {
      summary: "Upsert chatbot configuration",
      description: "Creates or updates the dynamic settings for the chatbot's persona and welcome message",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                botName: { type: "string", description: "Display name for the AI assistant" },
                persona: { type: "string", enum: ["friendly", "professional"], description: "The persona tone of the AI" },
                welcomeMessage: { type: "string", description: "The greeting message sent to new client sessions" },
                suggestions: {
                  type: "array",
                  items: { type: "string", maxLength: 100 },
                  maxItems: 20,
                  description: "Optional array of up to 20 chat suggestion questions (max 100 chars each)"
                },
              },
              required: ["botName", "persona", "welcomeMessage"],
            },
          },
        },
      },
      responses: {
        200: {
          description: "Successfully updated configuration",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  botName: { type: "string" },
                  persona: { type: "string" },
                  welcomeMessage: { type: "string" },
                  suggestions: {
                    type: "array",
                    items: { type: "string" }
                  },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        400: { description: "Missing required fields" },
        500: { description: "Internal server error" },
      },
    },
  },
};
