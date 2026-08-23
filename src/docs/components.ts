export const securitySchemes = {
  ApiKeyAuth: {
    type: "apiKey",
    in: "header",
    name: "x-api-key",
    description: "Custom static API Key for Chatbot Backend access validation",
  },
};
