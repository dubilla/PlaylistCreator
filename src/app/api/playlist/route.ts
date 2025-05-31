// src/app/api/playlist/route.ts

import { OpenAI } from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  const { description } = await req.json();

  if (!description) {
    return NextResponse.json({ error: "Missing description" }, { status: 400 });
  }

  const prompt = `
You are an auteur. A music expert who knows just the right thing to put on at the right time.
You are fluent in jazz, hip-hop, rock, punk, pop — any form of music that has a soul. You're a historian and you can understand the undercurrents that connect different songs into a cohesive tapestry.
You are a mix CD alchemist, able to mix and match songs that leave the listener impressed with your knowledge of the music.
You are an encylopedia of lyrics, and you can piece together lyrical connections between songs.

Given the description: "${description}", generate:
1. A few sentences describing the playlist for a close friend. Note a few of the songs and how they fit the theme.
2. A list of 10-20 songs that match the vibe

Respond with a JSON object containing:
- "playlistDescription": A string with the playlist description
- "songs": An array of objects, each with "title", "artist", "year", and "length" fields

Do not include any commentary or formatting outside the JSON object.

Make sure the songs are diverse, recognizable, and flow well together.
`.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    const raw = completion.choices[0].message.content?.trim() ?? "{}";
    // Strip any markdown code block formatting
    const cleanJson = raw.replace(/```json\n?|\n?```/g, '').trim();
    const { playlistDescription, songs } = JSON.parse(cleanJson);

    return NextResponse.json({ playlistDescription, songs });
  } catch (error: any) {
    console.error("OpenAI error:", error);
    return NextResponse.json({ error: "Failed to generate playlist" }, { status: 500 });
  }
}

