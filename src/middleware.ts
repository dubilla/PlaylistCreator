import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware to check for auth token
export function middleware(request: NextRequest) {
  // Only check auth for spotify-playlist endpoint
  if (request.nextUrl.pathname.startsWith("/api/spotify-playlist")) {
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
    // Only run on Spotify playlist API route
    "/api/spotify-playlist/:path*",
  ],
}; 