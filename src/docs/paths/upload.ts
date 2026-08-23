export const uploadPaths = {
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
};
