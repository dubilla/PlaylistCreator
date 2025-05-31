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
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { playlistName, playlistDescription, songs } = await req.json() as GeneratedPlaylist;

  if (!playlistName || !playlistDescription || !songs) {
    return NextResponse.json(
      { error: "Missing required playlist data" },
      { status: 400 }
    );
  }

  try {
    // Create Spotify playlist
    console.log("Creating Spotify playlist:", {
      name: playlistName,
      description: playlistDescription,
      userId: session.user?.id,
      hasAccessToken: !!session.accessToken,
    });

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
        const spotifyError = error as OpenAIError;
        console.error(`Error searching for track: ${song.title}`, spotifyError);
        notFoundTracks.push({ title: song.title, artist: song.artist });
      }
    }

    console.log("Found tracks:", {
      total: songs.length,
      found: trackUris.length,
      notFound: notFoundTracks.length,
    });

    // Add tracks to playlist
    if (trackUris.length > 0) {
      await addTracksToPlaylist(session, playlist.id, trackUris);
    }

    const response: SpotifyPlaylistResponse = {
      playlistUrl: playlist.external_urls.spotify,
      notFoundTracks,
    };

    return NextResponse.json(response);
  } catch (error) {
    const spotifyError = error as OpenAIError;
    console.error("Error creating Spotify playlist:", {
      error: spotifyError.message,
      stack: spotifyError.stack,
      session: {
        hasUser: !!session.user,
        userId: session.user?.id,
        hasAccessToken: !!session.accessToken,
      },
    });
    
    return NextResponse.json(
      { 
        error: spotifyError.message || "Failed to create Spotify playlist",
        details: spotifyError.stack,
      },
      { status: 500 }
    );
  }
} 