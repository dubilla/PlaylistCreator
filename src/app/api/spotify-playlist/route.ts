import { NextRequest, NextResponse } from "next/server";
// Removed: import { getServerSession } from "next-auth";
// Removed: import { authOptions } from "@/auth";
import { getAppSession } from "@/lib/session-manager"; // USE THIS
import {
  createSpotifyPlaylist,
  searchSpotifyTrack,
  addTracksToPlaylist,
} from "@/lib/spotify";
import { GeneratedPlaylist, SpotifyPlaylistResponse } from "@/types/playlist";

// Create playlist in Spotify
export async function POST(req: NextRequest) {
  try {
    const session = await getAppSession(req); // USE THIS

    // Conditional logging for debug purposes
    if (process.env.NODE_ENV !== 'test') {
      console.error("🔍 DEBUG - Spotify Playlist API Request Info:", { url: req.url, method: req.method });
      console.error("🔍 DEBUG - Session State (from getAppSession):", {
        hasSession: !!session,
        userId: session?.user?.id,
        hasAccessToken: !!(session as any)?.accessToken, // Cast if Session type needs it
        userEmail: session?.user?.email,
      });
    }

    // Updated session validation to use the session from getAppSession
    // Ensure your AppSession type (if defined) or casting handles accessToken and user.id
    if (!session || !(session as any).accessToken || !session.user?.id) {
      if (process.env.NODE_ENV !== 'test') { // Avoid excessive logging in tests for expected auth failures
        console.error("❌ ERROR - Authentication required or user ID/access token missing. Session:", session ? "Exists but incomplete" : "Null");
      }
      return NextResponse.json(
        { error: "Authentication required or user ID/access token missing" },
        { status: 401 }
      );
    }

    const { playlistName, playlistDescription, songs } = await req.json() as GeneratedPlaylist;

    if (!playlistName || !playlistDescription || !songs || !Array.isArray(songs) || songs.length === 0) { // Added more robust check
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
      } catch {
        notFoundTracks.push({ title: song.title, artist: song.artist });
      }
    }

    // Add tracks to playlist
    if (trackUris.length > 0) {
      await addTracksToPlaylist(session, playlist.id, trackUris);
    }

    // Create Spotify playlist
    // Ensure session object passed to Spotify functions is correctly typed/casted if necessary
    const playlist = await createSpotifyPlaylist(
      session as any, // Cast if necessary, prefer defining a proper AppSession type
      playlistName,
      playlistDescription
    );

    // Search for each track and collect URIs
    const trackUris: string[] = [];
    const notFoundTracks: { title: string; artist: string }[] = [];

    for (const song of songs) {
      try {
        const track = await searchSpotifyTrack(session as any, song.title, song.artist); // Cast session
        if (track && track.id) { // Assuming searchSpotifyTrack returns object with id
          trackUris.push(`spotify:track:${track.id}`);
        } else {
          notFoundTracks.push({ title: song.title, artist: song.artist });
        }
      } catch (searchError) {
        if (process.env.NODE_ENV !== 'test' || (process.env.NODE_ENV === 'test' && !(searchError instanceof Error && searchError.message.includes("Intentional test error")))) {
            console.error(`Error searching for track ${song.title} by ${song.artist}:`, searchError);
        }
        notFoundTracks.push({ title: song.title, artist: song.artist });
      }
    }

    // Add tracks to playlist
    if (trackUris.length > 0) {
      await addTracksToPlaylist(session as any, playlist.id, trackUris); // Cast session
    }

    const response: SpotifyPlaylistResponse = {
      playlistUrl: playlist.external_urls?.spotify, // Optional chaining
      notFoundTracks: notFoundTracks.length > 0 ? notFoundTracks : undefined,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    // Log the error with more details
    if (process.env.NODE_ENV !== 'test' || (process.env.NODE_ENV === 'test' && !(error instanceof Error && error.message.includes("Intentional test error")))){
        console.error("❌ ERROR - Failed to process /api/spotify-playlist request:", error);
    }

    if (error instanceof SyntaxError && error.message.toLowerCase().includes("json")) { // More specific check for JSON SyntaxError
        return NextResponse.json({ error: "Invalid request body: Malformed JSON." }, { status: 400 });
    }
    // Handle other specific errors if needed, e.g., from Spotify library calls if they throw typed errors
    // For now, a generic error message for other failures
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create Spotify playlist" },
      { status: 500 }
    );
  }
}