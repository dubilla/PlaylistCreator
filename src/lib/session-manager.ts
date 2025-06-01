import { getServerSession as actualGetServerSession, Session } from "next-auth";
import { authOptions } from "@/auth";
import { NextRequest } from "next/server"; // For App Router
// If using Pages Router, you might need:
// import { NextApiRequest, NextApiResponse } from "next";

// Define a type for the session object if not already globally available or specific
// For example, if your session includes an accessToken:
// interface AppSession extends Session {
//   accessToken?: string;
//   user?: {
//     id?: string;
//     // other user properties
//   } & Session['user'];
// }

export async function getAppSession(req: NextRequest): Promise<Session | null> {
  // Check if running in a test environment and if a test session header is provided
  if (process.env.NODE_ENV === 'test') {
    const testSessionHeader = req.headers.get('x-test-session');
    // Check if the header exists (it could be an empty string for null session)
    if (testSessionHeader !== null) {
      try {
        // If header is empty string or "null", parse to null, otherwise parse as JSON
        if (testSessionHeader === "" || testSessionHeader.toLowerCase() === "null") {
          return null;
        }
        return JSON.parse(testSessionHeader) as Session;
      } catch (e) {
        console.error("Failed to parse x-test-session header:", e);
        // Fallback to null or throw an error, depending on desired test behavior on malformed header
        return null;
      }
    }
  }

  // Production path: use actual getServerSession with authOptions
  // Note: For App Router, getServerSession(authOptions) is correct.
  // For Pages Router, it would be getServerSession(req, res, authOptions).
  return actualGetServerSession(authOptions);
}
