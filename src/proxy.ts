import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "";

    if (request.nextUrl.pathname.startsWith("/api/")) {
      if (request.method === "OPTIONS") {
        const response = new NextResponse(null, { status: 204 });
        if (allowedOrigin && origin === allowedOrigin) {
          response.headers.set("Access-Control-Allow-Origin", origin);
        }
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
        response.headers.set("Access-Control-Max-Age", "86400");
        return response;
      }

      if (!request.nextUrl.pathname.startsWith("/api/whatsapp/webhook")) {
        const apiKey = request.headers.get("x-api-key");
        const backendApiKey = process.env.BACKEND_API_KEY;

        if (!backendApiKey || apiKey !== backendApiKey) {
          const response = NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
          );
          if (allowedOrigin && origin === allowedOrigin) {
            response.headers.set("Access-Control-Allow-Origin", origin);
          }
          return response;
        }
      }

      const response = NextResponse.next();
      if (allowedOrigin && origin === allowedOrigin) {
        response.headers.set("Access-Control-Allow-Origin", origin);
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
      }
      return response;
    }
}

export const config = {
  matcher: "/api/:path*",
};
