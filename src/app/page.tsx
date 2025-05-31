"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import { Song, GeneratedPlaylist, SpotifyPlaylistResponse } from "@/types/playlist";

function AuthButton() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  if (isLoading) {
    return (
      <button
        disabled
        className="bg-gray-200 text-gray-500 px-4 py-2 rounded flex items-center gap-2"
      >
        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
        Loading...
      </button>
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-4 mb-6">
        {session.user?.image && (
          <Image
            src={session.user.image}
            alt={session.user.name || "Profile"}
            width={32}
            height={32}
            className="rounded-full"
          />
        )}
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Signed in as <span className="font-medium">{session.user?.name}</span>
          </p>
        </div>
        <button
          onClick={() => signOut()}
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("spotify")}
      className="bg-[#1DB954] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#1ed760] transition-colors"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
      Sign in with Spotify
    </button>
  );
}

export default function Home() {
  const [description, setDescription] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [creatingSpotify, setCreatingSpotify] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const [notFoundTracks, setNotFoundTracks] = useState<{ title: string; artist: string }[]>([]);
  const { data: session } = useSession();

  const generatePlaylist = async () => {
    if (!session) {
      signIn("spotify");
      return;
    }

    setLoading(true);
    setPlaylistUrl(null);
    setNotFoundTracks([]);
    setSongs([]);
    setPlaylistDescription("");
    setPlaylistName("");

    try {
      const res = await fetch("/api/playlist", {
        method: "POST",
        body: JSON.stringify({ description }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json() as GeneratedPlaylist;
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate playlist");
      }

      setSongs(data.songs || []);
      setPlaylistName(data.playlistName || "");
      setPlaylistDescription(data.playlistDescription || "");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate playlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const createSpotifyPlaylist = async () => {
    if (!session) {
      signIn("spotify");
      return;
    }

    setCreatingSpotify(true);
    setPlaylistUrl(null);
    setNotFoundTracks([]);

    try {
      const res = await fetch("/api/playlist", {
        method: "PUT",
        body: JSON.stringify({
          playlistName,
          playlistDescription,
          songs,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json() as SpotifyPlaylistResponse;
      
      if (!res.ok) {
        console.error("Spotify playlist creation failed:", {
          status: res.status,
          statusText: res.statusText,
          error: data.error,
          details: data.details,
        });
        throw new Error(data.error || "Failed to create Spotify playlist");
      }

      setPlaylistUrl(data.playlistUrl);
      setNotFoundTracks(data.notFoundTracks || []);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error creating Spotify playlist:", {
          message: error.message,
          stack: error.stack,
        });
        alert(`Failed to create Spotify playlist: ${error.message}`);
      } else {
        alert("Failed to create Spotify playlist. Please try again.");
      }
    } finally {
      setCreatingSpotify(false);
    }
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Playlist Generator 🎶</h1>
      <AuthButton />
      
      {session && (
        <>
          <textarea
            className="w-full p-2 border rounded mb-4"
            rows={3}
            placeholder="Describe your vibe (e.g. sunset rooftop party)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-4 mb-6">
            <button
              onClick={generatePlaylist}
              className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Playlist"}
            </button>
            {songs.length > 0 && (
              <button
                onClick={createSpotifyPlaylist}
                className="bg-[#1DB954] text-white px-4 py-2 rounded disabled:opacity-50 flex items-center gap-2"
                disabled={creatingSpotify}
              >
                {creatingSpotify ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    Create in Spotify
                  </>
                )}
              </button>
            )}
          </div>

          {playlistName && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">{playlistName}</h2>
              {playlistDescription && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">{playlistDescription}</p>
              )}
            </div>
          )}

          {playlistUrl && (
            <div className="mt-4">
              <a
                href={playlistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#1DB954] hover:text-[#1ed760]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Open in Spotify
              </a>
            </div>
          )}

          {notFoundTracks.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Some tracks couldn&apos;t be found on Spotify:
              </h3>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                {notFoundTracks.map((track, i) => (
                  <li key={i}>
                    {track.artist} – &ldquo;{track.title}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          )}

          {songs.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Track List</h2>
              <ul className="space-y-3">
                {songs.map((song, i) => (
                  <li key={i} className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium">{song.artist}</p>
                        <h3 className="text-lg text-gray-800 dark:text-gray-200">&ldquo;{song.title}&rdquo;</h3>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
                        <div>{song.year}</div>
                        <div>{song.length}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </main>
  );
}
