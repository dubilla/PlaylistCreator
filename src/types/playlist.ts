export interface Song {
  title: string;
  artist: string;
  year: string;
  length: string;
}

export interface GeneratedPlaylist {
  playlistName: string;
  playlistDescription: string;
  songs: Song[];
  error?: string;
}

export interface SpotifyPlaylistResponse {
  playlistUrl: string;
  notFoundTracks: { title: string; artist: string }[];
  error?: string;
  details?: string;
}

export interface OpenAIError {
  message: string;
  stack?: string;
} 