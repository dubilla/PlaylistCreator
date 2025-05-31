// src/app/api/playlist/route.ts

import { OpenAI } from "openai";
import { NextRequest, NextResponse } from "next/server";
import { GeneratedPlaylist, OpenAIError } from "@/types/playlist";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Generate playlist using OpenAI
export async function POST(req: NextRequest) {
  const { description } = await req.json();

  if (!description) {
    return NextResponse.json({ error: "Missing description" }, { status: 400 });
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

  try {
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
      playlistName: safePlaylistName,
      playlistDescription,
      songs,
    });
  } catch (error) {
    const openAIError = error as OpenAIError;
    console.error("Error generating playlist:", openAIError);
    return NextResponse.json(
      { error: "Failed to generate playlist" },
      { status: 500 }
    );
  }
}

