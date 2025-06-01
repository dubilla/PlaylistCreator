// src/app/api/playlist/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { GeneratedPlaylist, OpenAIError } from "@/types/playlist";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Generate playlist using OpenAI
export async function POST(req: NextRequest) {
  let session; // Declare session variable

  // Check for a special header indicating a test environment and providing session data
  const testSessionHeader = req.headers.get('x-test-session');

  if (process.env.NODE_ENV === 'test' && testSessionHeader !== undefined) {
    try {
      // If header is empty string or "null", parse to null, otherwise parse as JSON
      session = testSessionHeader && testSessionHeader !== 'null' ? JSON.parse(testSessionHeader) : null;
    } catch (e) {
      console.error("Failed to parse x-test-session header:", e);
      return NextResponse.json({ error: "Invalid x-test-session format" }, { status: 500 });
    }
  } else {
    // Production path: use actual getServerSession
    // Conditional logging for non-test environments or when not using the test header
    if (process.env.NODE_ENV !== 'test') {
      console.error("🔍 DEBUG - Playlist API Request (Non-Test):", {
        url: req.url,
        method: req.method,
        cookie: req.headers.get("cookie"),
        authorization: req.headers.get("authorization"),
        host: req.headers.get("host"),
        origin: req.headers.get("origin"),
        allHeaders: Object.fromEntries(req.headers.entries()),
      });
    }
    session = await getServerSession(authOptions);
    if (process.env.NODE_ENV !== 'test') {
      console.error("🔍 DEBUG - Session State (Non-Test):", {
        hasSession: !!session,
        userId: session?.user?.id,
        hasAccessToken: !!session?.accessToken,
        userEmail: session?.user?.email,
        sessionKeys: session ? Object.keys(session) : [],
        fullSession: session,
      });
    }
  }

  // Existing session check, adjusted for the new session variable
  // The original code used `if (!session)` which is fine.
  // For testing, accessToken and user.id are primary concerns for this route's logic.
  if (!session?.accessToken || !session?.user?.id) { // Check for specific properties needed
    // Conditional logging for authentication failure
    if (process.env.NODE_ENV !== 'test' || (process.env.NODE_ENV === 'test' && testSessionHeader === undefined)) {
        console.error("❌ ERROR - Authentication failed or session data incomplete in playlist API route:", {
            hasSession: !!session,
            hasAccessToken: !!session?.accessToken,
            hasUserId: !!session?.user?.id,
        });
    }
    return NextResponse.json(
      { error: "User not authenticated or session data incomplete" }, // Updated error message
      { status: 401 }
    );
  }

  try { // Added try block for the main logic post-session retrieval
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

