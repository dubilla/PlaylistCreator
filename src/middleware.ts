import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware to check for auth token
export function middleware(request: NextRequest) {
  // Only run on playlist API routes
  if (request.nextUrl.pathname.startsWith("/api/playlist")) {
    const token = request.cookies.get("next-auth.session-token");
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: [
    // Only run on API routes that need auth
    "/api/playlist/:path*",
  ],
}; 