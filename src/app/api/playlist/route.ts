// src/app/api/playlist/route.ts

import { NextRequest, NextResponse } from "next/server";
// Removed: import { getServerSession } from "next-auth";
// Removed: import { authOptions } from "@/auth";
import { getAppSession } from "@/lib/session-manager"; // Using alias
import { GeneratedPlaylist, OpenAIError } from "@/types/playlist";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Generate playlist using OpenAI
export async function POST(req: NextRequest) {
  try {
    // Keep existing logging for request details, or move to getAppSession if preferred
    if (process.env.NODE_ENV !== 'test') { // Conditional logging for non-test environments
        console.error("🔍 DEBUG - Playlist API Request:", {
        url: req.url,
        method: req.method,
        cookie: req.headers.get("cookie"),
        authorization: req.headers.get("authorization"),
        host: req.headers.get("host"),
        origin: req.headers.get("origin"),
        allHeaders: Object.fromEntries(req.headers.entries()),
        });
    }

    const session = await getAppSession(req); // New session retrieval

    // Log session state from getAppSession (can be conditional)
    if (process.env.NODE_ENV !== 'test') {
        console.error("🔍 DEBUG - Session State (from getAppSession):", {
        hasSession: !!session,
        userId: session?.user?.id,
        hasAccessToken: !!(session as any)?.accessToken, // Cast if accessToken not in default Session type
        userEmail: session?.user?.email,
        sessionKeys: session ? Object.keys(session) : [],
        // fullSession: session, // Be cautious logging full session in production
        });
    }

    // Ensure your Session type used by getAppSession and expected here includes accessToken and user.id
    // The actual type for session in next-auth.d.ts should include these.
    // If using the default Session type from next-auth, casting (as any) might be needed for accessToken.
    // It's better to have a custom Session type defined in next-auth.d.ts.
    if (!session || !(session as any).accessToken || !session.user?.id) {
      if (process.env.NODE_ENV !== 'test') { // Avoid excessive logging in tests for expected auth failures
        console.error("❌ ERROR - No session, accessToken, or user.id found in playlist API route");
      }
      return NextResponse.json(
        { error: "Authentication required" }, // Simplified error message
        { status: 401 }
      );
    }

    const { description } = await req.json();

    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const prompt = `
You are an auteur. A music expert who knows just the right thing to put on at the right time.
You are fluent in jazz, hip-hop, rock, punk, pop — any form of music that has a soul. You're a historian and you can understand the undercurrents that connect different songs into a cohesive tapestry.

Given the description: "${description}", generate:
1. A short, catchy playlist name (max 30 characters)
2. A brief description of how you would describe the playlist to a friend
3. A list of 10-20 songs that match the vibe

Respond with a JSON object containing:
- "playlistName": A short, catchy name for the playlist (max 30 characters)
- "playlistDescription": A string with the playlist description
- "songs": An array of objects, each with "title", "artist", "year", and "length" fields

Do not include any commentary or formatting outside the JSON object.

Make sure the songs are diverse, recognizable, and flow well together.
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    const raw = completion.choices[0].message.content?.trim() ?? "{}";
    const cleanJson = raw.replace(/```json\n?|\n?```/g, "").trim();
    const { playlistName, playlistDescription, songs } = JSON.parse(cleanJson) as GeneratedPlaylist;

    // Ensure playlist name is within limits
    const safePlaylistName = playlistName.slice(0, 30);

    return NextResponse.json({
      // message: "Playlist created successfully!", // Adding this for consistency with test expectations if needed
      playlistName: safePlaylistName,
      playlistDescription,
      songs,
    });
  } catch (error) { // This catch block is now for errors within the main logic
    // Avoid logging the whole error object if it's a test with intentional failure
    if (process.env.NODE_ENV !== 'test') {
        // Keep original OpenAIError typing if it's specific and useful
        const specificError = error as OpenAIError; // Or any other specific error type
        console.error("Error during playlist generation logic:", specificError);
    } else if (!(error instanceof Error && error.message.includes("Intentional test error"))) {
        // Log errors in test unless they are marked as intentional
        console.error("Error during playlist generation logic (test):", error);
    }
    // Check if the error is from OpenAI or a parsing error to return specific messages
    if (error instanceof SyntaxError) { // JSON parsing error
        return NextResponse.json({ error: "Failed to parse playlist ideas" }, { status: 500 });
    } else if (error instanceof OpenAIError || (error as any)?.response?.status === 500) { // OpenAI specific error or generic 500 from it
        return NextResponse.json({ error: "Failed to generate playlist ideas" }, { status: 500 });
    }
    // Generic error for other cases
    return NextResponse.json(
      { error: "Failed to generate playlist" },
      { status: 500 }
    );
  }
}

