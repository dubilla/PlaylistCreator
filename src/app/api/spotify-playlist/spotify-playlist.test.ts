// src/app/api/spotify-playlist/spotify-playlist.test.ts

import { POST } from './route';
import { NextRequest } from 'next/server';
// No imports from next-auth or @/auth needed for mocking here

// Mock @/lib/spotify functions
const mockCreateSpotifyPlaylist = jest.fn();
const mockSearchSpotifyTrack = jest.fn();
const mockAddTracksToPlaylist = jest.fn();

jest.mock('@/lib/spotify', () => ({
  createSpotifyPlaylist: mockCreateSpotifyPlaylist,
  searchSpotifyTrack: mockSearchSpotifyTrack,
  addTracksToPlaylist: mockAddTracksToPlaylist,
}));

// Ensure NODE_ENV is set to 'test' for the new logic in POST to work
process.env.NODE_ENV = 'test';

describe('/api/spotify-playlist POST handler (with x-test-session header)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validSession = {
    user: { id: 'test-user-id' },
    accessToken: 'test-access-token',
  };

  const validPlaylistData = {
    playlistName: 'Test Playlist',
    playlistDescription: 'A test description',
    songs: [{ title: 'Song 1', artist: 'Artist 1', year: '2023', length: '3:00' }],
  };

  describe('Authentication', () => {
    it('should return 401 if x-test-session is "null" (unauthenticated)', async () => {
      const request = new NextRequest('http://localhost/api/spotify-playlist', {
        method: 'POST',
        headers: { 'x-test-session': 'null' },
        body: JSON.stringify(validPlaylistData),
      });
      const response = await POST(request);
      const responseBody = await response.json();
      expect(response.status).toBe(401);
      expect(responseBody.error).toContain('Authentication required');
    });

    it('should return 401 if x-test-session is missing user.id', async () => {
      const sessionMissingUserId = { accessToken: 'test-token', user: {} }; // Missing user.id
      const request = new NextRequest('http://localhost/api/spotify-playlist', {
        method: 'POST',
        headers: { 'x-test-session': JSON.stringify(sessionMissingUserId) },
        body: JSON.stringify(validPlaylistData),
      });
      const response = await POST(request);
      const responseBody = await response.json();
      expect(response.status).toBe(401);
      expect(responseBody.error).toContain('User ID not available');
    });

    it('should return 401 if x-test-session is missing accessToken', async () => {
      const sessionMissingToken = { user: { id: 'test-user-id' } }; // Missing accessToken
      const request = new NextRequest('http://localhost/api/spotify-playlist', {
        method: 'POST',
        headers: { 'x-test-session': JSON.stringify(sessionMissingToken) },
        body: JSON.stringify(validPlaylistData),
      });
      const response = await POST(request);
      const responseBody = await response.json();
      expect(response.status).toBe(401);
      expect(responseBody.error).toContain('Access Token not available');
    });
  });

  describe('Request Body Validation', () => {
    it('should return 400 if playlistName is missing', async () => {
      const { playlistName, ...incompleteData } = validPlaylistData;
      const request = new NextRequest('http://localhost/api/spotify-playlist', {
        method: 'POST',
        headers: { 'x-test-session': JSON.stringify(validSession) },
        body: JSON.stringify(incompleteData),
      });
      const response = await POST(request);
      const responseBody = await response.json();
      expect(response.status).toBe(400);
      expect(responseBody.error).toBe('Missing required playlist data');
    });
     it('should return 400 if songs array is empty', async () => {
      const dataWithEmptySongs = { ...validPlaylistData, songs: [] };
      const request = new NextRequest('http://localhost/api/spotify-playlist', {
        method: 'POST',
        headers: { 'x-test-session': JSON.stringify(validSession) },
        body: JSON.stringify(dataWithEmptySongs),
      });
      const response = await POST(request);
      const responseBody = await response.json();
      expect(response.status).toBe(400);
      expect(responseBody.error).toBe('Missing required playlist data');
    });
  });

  describe('Spotify Interaction Logic (Authenticated)', () => {
    beforeEach(() => {
      // Reset mocks for Spotify lib functions to default success states
      mockCreateSpotifyPlaylist.mockResolvedValue({ id: 'mock-playlist-id', external_urls: { spotify: 'spotify:playlist:mock-playlist-id' } });
      mockSearchSpotifyTrack.mockImplementation(async (session, title, artist) => ({ id: `id-${title}`, uri: `spotify:track:${title}-${artist}` }));
      mockAddTracksToPlaylist.mockResolvedValue({ snapshot_id: 'mock-snapshot-id' });
    });

    it('should successfully create playlist and add tracks', async () => {
      const request = new NextRequest('http://localhost/api/spotify-playlist', {
        method: 'POST',
        headers: { 'x-test-session': JSON.stringify(validSession) },
        body: JSON.stringify(validPlaylistData),
      });
      const response = await POST(request);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.playlistUrl).toBe('spotify:playlist:mock-playlist-id');
      expect(responseBody.notFoundTracks).toBeUndefined();
      expect(mockCreateSpotifyPlaylist).toHaveBeenCalledWith(validSession, validPlaylistData.playlistName, validPlaylistData.playlistDescription);
      expect(mockSearchSpotifyTrack).toHaveBeenCalledTimes(validPlaylistData.songs.length);
      expect(mockAddTracksToPlaylist).toHaveBeenCalledWith(validSession, 'mock-playlist-id', ['spotify:track:Song 1-Artist 1']);
    });

    it('should return 500 if createSpotifyPlaylist fails', async () => {
      mockCreateSpotifyPlaylist.mockRejectedValueOnce(new Error('Failed to create playlist'));
      const request = new NextRequest('http://localhost/api/spotify-playlist', {
        method: 'POST',
        headers: { 'x-test-session': JSON.stringify(validSession) },
        body: JSON.stringify(validPlaylistData),
      });
      const response = await POST(request);
      const responseBody = await response.json();
      expect(response.status).toBe(500);
      expect(responseBody.error).toBe('Failed to create playlist');
    });

    it('should handle some tracks not found by searchSpotifyTrack', async () => {
      const songs = [
        { title: 'Found Song', artist: 'Artist A', year: '2023', length: '3:00' },
        { title: 'Not Found Song', artist: 'Artist B', year: '2023', length: '3:00' },
      ];
      mockSearchSpotifyTrack.mockImplementation(async (session, title, artist) => {
        if (title === 'Found Song') return { id: 'found-id', uri: 'spotify:track:found-id' };
        return null; // Simulate 'Not Found Song' not found
      });
      const request = new NextRequest('http://localhost/api/spotify-playlist', {
        method: 'POST',
        headers: { 'x-test-session': JSON.stringify(validSession) },
        body: JSON.stringify({ ...validPlaylistData, songs }),
      });
      const response = await POST(request);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.notFoundTracks).toEqual([{ title: 'Not Found Song', artist: 'Artist B' }]);
      expect(mockAddTracksToPlaylist).toHaveBeenCalledWith(validSession, 'mock-playlist-id', ['spotify:track:found-id']);
    });

    it('should handle searchSpotifyTrack throwing an error for a song', async () => {
        const songs = [
            { title: 'Good Song', artist: 'Artist A', year: '2023', length: '3:00' },
            { title: 'Error Song', artist: 'Artist B', year: '2023', length: '3:00' },
        ];
        mockSearchSpotifyTrack.mockImplementation(async (session, title, artist) => {
            if (title === 'Good Song') return { id: 'good-id', uri: 'spotify:track:good-id' };
            if (title === 'Error Song') throw new Error('Intentional test error: Search failed');
            return null;
        });
        const request = new NextRequest('http://localhost/api/spotify-playlist', {
            method: 'POST',
            headers: { 'x-test-session': JSON.stringify(validSession) },
            body: JSON.stringify({ ...validPlaylistData, songs }),
        });
        const response = await POST(request);
        const responseBody = await response.json();

        expect(response.status).toBe(200);
        expect(responseBody.notFoundTracks).toEqual([{ title: 'Error Song', artist: 'Artist B' }]);
        expect(mockAddTracksToPlaylist).toHaveBeenCalledWith(validSession, 'mock-playlist-id', ['spotify:track:good-id']);
    });

    it('should not call addTracksToPlaylist if no track URIs are found', async () => {
      mockSearchSpotifyTrack.mockResolvedValue(null); // All tracks not found
      const request = new NextRequest('http://localhost/api/spotify-playlist', {
        method: 'POST',
        headers: { 'x-test-session': JSON.stringify(validSession) },
        body: JSON.stringify(validPlaylistData),
      });
      const response = await POST(request);
      await response.json(); // Consume body

      expect(response.status).toBe(200);
      expect(mockAddTracksToPlaylist).not.toHaveBeenCalled();
    });

    it('should return 500 if addTracksToPlaylist fails', async () => {
      mockAddTracksToPlaylist.mockRejectedValueOnce(new Error('Failed to add tracks'));
      const request = new NextRequest('http://localhost/api/spotify-playlist', {
        method: 'POST',
        headers: { 'x-test-session': JSON.stringify(validSession) },
        body: JSON.stringify(validPlaylistData),
      });
      const response = await POST(request);
      const responseBody = await response.json();
      expect(response.status).toBe(500);
      expect(responseBody.error).toBe('Failed to add tracks');
    });
  });
});
