"use client";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
    const [description, setDescription] = useState("");
  const [songs, setSongs] = useState<any[]>([]);
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const generatePlaylist = async () => {
    setLoading(true);
    const res = await fetch("/api/playlist", {
      method: "POST",
      body: JSON.stringify({ description }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    setSongs(data.songs || []);
    setPlaylistDescription(data.playlistDescription || "");
    setLoading(false);
  };

  return (
  <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Playlist Generator 🎶</h1>
      <textarea
        className="w-full p-2 border rounded mb-4"
        rows={3}
        placeholder="Describe your vibe (e.g. sunset rooftop party)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button
        onClick={generatePlaylist}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Playlist"}
      </button>

      {playlistDescription && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">{playlistDescription}</p>
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
                    <h3 className="text-lg text-gray-800 dark:text-gray-200">"{song.title}"</h3>
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
    </main>
  );
}
