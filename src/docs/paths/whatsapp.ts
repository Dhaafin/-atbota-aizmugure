export const whatsappPaths = {
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
};
