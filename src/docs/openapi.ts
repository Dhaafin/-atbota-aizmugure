import { uploadPaths } from "./paths/upload";
import { chatPaths } from "./paths/chat";
import { whatsappPaths } from "./paths/whatsapp";
import { sessionsPaths } from "./paths/sessions";
import { configPaths } from "./paths/config";
import { securitySchemes } from "./components";

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
    ...uploadPaths,
    ...chatPaths,
    ...whatsappPaths,
    ...sessionsPaths,
    ...configPaths,
  },
  components: {
    securitySchemes,
  },
};

