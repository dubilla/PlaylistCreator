import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import {
  createSpotifyPlaylist,
  searchSpotifyTrack,
  addTracksToPlaylist,
} from "@/lib/spotify";
import { GeneratedPlaylist, SpotifyPlaylistResponse, OpenAIError } from "@/types/playlist";

// Create playlist in Spotify
export async function POST(req: NextRequest) {
  try {

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!session.user?.id) {
      return NextResponse.json(
        { error: "User ID not available" },
        { status: 401 }
      );
    }

    const { playlistName, playlistDescription, songs } = await req.json() as GeneratedPlaylist;

    if (!playlistName || !playlistDescription || !songs) {
      return NextResponse.json(
        { error: "Missing required playlist data" },
        { status: 400 }
      );
    }

    // Create Spotify playlist

    const playlist = await createSpotifyPlaylist(
      session,
      playlistName,
      playlistDescription
    );

    // Search for each track and collect URIs
    const trackUris: string[] = [];
    const notFoundTracks: { title: string; artist: string }[] = [];

    for (const song of songs) {
      try {
        const track = await searchSpotifyTrack(session, song.title, song.artist);
        if (track) {
          trackUris.push(`spotify:track:${track.id}`);
        } else {
          notFoundTracks.push({ title: song.title, artist: song.artist });
        }
      } catch (error) {
        notFoundTracks.push({ title: song.title, artist: song.artist });
      }
    }

    // Add tracks to playlist
    if (trackUris.length > 0) {
      await addTracksToPlaylist(session, playlist.id, trackUris);
    }

    const response: SpotifyPlaylistResponse = {
      playlistUrl: playlist.external_urls.spotify,
      notFoundTracks,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    // Next.js Auth will give us a proper error response
    if (error?.message?.includes("auth")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Spotify API errors will already be properly formatted
    return NextResponse.json(
      { error: error?.message || "Failed to create Spotify playlist" },
      { status: 500 }
    );
  }
} 