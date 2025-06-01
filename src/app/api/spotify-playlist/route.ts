import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import {
  createSpotifyPlaylist,
  searchSpotifyTrack,
  addTracksToPlaylist,
} from "@/lib/spotify";
import { GeneratedPlaylist, SpotifyPlaylistResponse } from "@/types/playlist";

// Create playlist in Spotify
export async function POST(req: NextRequest) {
  let session;

  const testSessionHeader = req.headers.get('x-test-session');
  if (process.env.NODE_ENV === 'test' && testSessionHeader !== undefined) {
    try {
      session = testSessionHeader && testSessionHeader !== 'null' ? JSON.parse(testSessionHeader) : null;
    } catch (e) {
      console.error("Failed to parse x-test-session header in spotify-playlist:", e);
      return NextResponse.json({ error: "Invalid x-test-session format" }, { status: 500 });
    }
  } else {
    // Conditional logging for non-test environments can be added here if desired
    session = await getServerSession(authOptions);
  }

  // Session validation logic from original code, now applied to 'session' variable
  if (!session) {
    // Log only if not a test or test header wasn't used to explicitly set null session
    if (process.env.NODE_ENV !== 'test' || (process.env.NODE_ENV === 'test' && testSessionHeader === undefined)) {
        console.error("Authentication required: No session provided.");
    }
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  if (!session.user?.id) { // Also check for accessToken if it's used directly from session object later
    if (process.env.NODE_ENV !== 'test' || (process.env.NODE_ENV === 'test' && testSessionHeader === undefined)) {
        console.error("User ID not available in session.");
    }
    return NextResponse.json(
      { error: "User ID not available" }, // Or a more generic "Unauthorized" or "Session data incomplete"
      { status: 401 }
    );
  }
  // Add check for accessToken if your Spotify lib functions require it directly from session object
  if (!session.accessToken) {
    if (process.env.NODE_ENV !== 'test' || (process.env.NODE_ENV === 'test' && testSessionHeader === undefined)) {
        console.error("Access Token not available in session.");
    }
    return NextResponse.json(
        { error: "Access Token not available" },
        { status: 401 }
    );
  }


  try { // Start of the main try block for playlist creation logic
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
      } catch {
        notFoundTracks.push({ title: song.title, artist: song.artist });
      }
    }

    // Add tracks to playlist
    if (trackUris.length > 0) {
      await addTracksToPlaylist(session, playlist.id, trackUris);
    }

    const response: SpotifyPlaylistResponse = {
      playlistUrl: playlist.external_urls.spotify, // Consider optional chaining: playlist.external_urls?.spotify
      notFoundTracks: notFoundTracks.length > 0 ? notFoundTracks : undefined, // Set to undefined if empty
    };

    return NextResponse.json(response);
  } catch (error: unknown) { // This catch is for errors within the playlist creation logic
    // Log general processing error only in non-test or if it's not an intentional test error
    if (process.env.NODE_ENV !== 'test' || (process.env.NODE_ENV === 'test' && !(error instanceof Error && error.message.includes("Intentional test error")))) {
        console.error("Error processing Spotify playlist request:", error);
    }

    // Specific error messages based on error type
    if (error instanceof SyntaxError) { // From await req.json() if body is malformed
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    // Example: Check for errors from your Spotify lib functions if they throw custom errors or specific messages
    // For now, using a generic message for other errors from this block
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process Spotify playlist request" },
      { status: 500 }
    );
  }
}