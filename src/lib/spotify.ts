import { Session } from "next-auth";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
}

export async function createSpotifyPlaylist(
  session: Session,
  name: string,
  description: string
) {
  if (!session.accessToken) {
    throw new Error("No access token available");
  }

  if (!session.user?.id) {
    throw new Error("No user ID available");
  }

  const response = await fetch(
    `https://api.spotify.com/v1/users/${session.user.id}/playlists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
        public: false,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      `Failed to create playlist: ${errorData?.error?.message || response.statusText}`
    );
  }

  return response.json();
}

export async function searchSpotifyTrack(
  session: Session,
  title: string,
  artist: string
): Promise<SpotifyTrack | null> {
  const query = `${title} artist:${artist}`;
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      query
    )}&type=track&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to search for track");
  }

  const data = await response.json();
  const tracks = data.tracks?.items;

  if (!tracks || tracks.length === 0) {
    return null;
  }

  return tracks[0];
}

export async function addTracksToPlaylist(
  session: Session,
  playlistId: string,
  trackUris: string[]
) {
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: trackUris,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to add tracks to playlist");
  }

  return response.json();
} 