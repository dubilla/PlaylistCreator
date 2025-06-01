// src/app/api/playlist/playlist.test.ts

import { POST } from './route';
import { NextRequest } from 'next/server';
// No longer importing from next-auth or @/auth for mocking purposes here
import OpenAI from 'openai';
import { createSpotifyPlaylist, searchSpotifyTrack, addTracksToPlaylist } from '@/lib/spotify';

// Ensure NODE_ENV is set to 'test' for the new logic in POST to work
process.env.NODE_ENV = 'test';

// --- Mocking openai ---
jest.mock('openai');
const mockOpenAIInstance = OpenAI as jest.Mocked<typeof OpenAI>;
const mockChatCompletionsCreate = jest.fn();

// --- Mocking @/lib/spotify ---
jest.mock('@/lib/spotify');
const mockedCreateSpotifyPlaylist = createSpotifyPlaylist as jest.Mock;
const mockedSearchSpotifyTrack = searchSpotifyTrack as jest.Mock;
const mockedAddTracksToPlaylist = addTracksToPlaylist as jest.Mock;


describe('/api/playlist POST handler (with x-test-session header)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock for OpenAI client instance
    mockOpenAIInstance.mockImplementation(() => ({
        chat: {
            completions: {
                create: mockChatCompletionsCreate,
            },
        },
    } as any));

    // Default mocks for Spotify utilities
    mockedCreateSpotifyPlaylist.mockResolvedValue({
      id: 'mock-playlist-id',
      external_urls: { spotify: 'http://spotify.com/playlist/mock-playlist-id' }
    });
    mockedSearchSpotifyTrack.mockImplementation(async (session, title, artist) => `spotify:track:${title}-${artist}`);
    mockedAddTracksToPlaylist.mockResolvedValue({ snapshot_id: 'mock-snapshot-id' });
  });

  // --- Test Cases ---

  describe('Authentication', () => {
    describe('Given user is authenticated (via x-test-session header)', () => {
      const mockUserSession = { // This is the structure our API route expects for session.user and session.accessToken
        accessToken: 'mock-access-token',
        user: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
      };

      it('should generate playlist, truncate name, and handle markdown JSON successfully when description is provided', async () => {
        const description = 'A playlist of energetic rock songs for working out';
        const longPlaylistName = 'High Energy Rock Workout Playlist for Gym'; // > 30 chars
        const truncatedPlaylistName = 'High Energy Rock Workout Playl'; // 30 chars
        const openAIResponse = {
          // The route.ts now expects playlistName, playlistDescription, songs
          playlistName: longPlaylistName,
          playlistDescription: "An energetic rock playlist.",
          songs: [ // Changed from "tracks" to "songs" to match route.ts expectation from OpenAI
            { title: 'Thunderstruck', artist: 'AC/DC', year: '1990', length: '4:52' },
            { title: 'Kickstart My Heart', artist: 'Mötley Crüe', year: '1989', length: '4:43' },
          ],
        };
        mockChatCompletionsCreate.mockResolvedValueOnce({
          choices: [{ message: { content: '```json\n' + JSON.stringify(openAIResponse) + '\n```' } }],
        });

        const request = new NextRequest('http://localhost/api/playlist', {
          method: 'POST',
          headers: { 'x-test-session': JSON.stringify(mockUserSession) },
          body: JSON.stringify({ description }),
        });

        const response = await POST(request);
        const responseBody = await response.json();

        expect(response.status).toBe(200);
        // The API route now returns playlistName, playlistDescription, songs
        expect(responseBody).toEqual({
          playlistName: truncatedPlaylistName,
          playlistDescription: openAIResponse.playlistDescription,
          songs: openAIResponse.songs,
        });
        expect(mockChatCompletionsCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({ role: 'user', content: expect.stringContaining(description) }),
            ]),
          })
        );
        // Verify that createSpotifyPlaylist was called with the truncated name and correct session
        expect(mockedCreateSpotifyPlaylist).toHaveBeenCalledWith(mockUserSession, truncatedPlaylistName, description);
        expect(mockedAddTracksToPlaylist).toHaveBeenCalled(); // As songs are present
      });

      it('should return 400 if description is missing', async () => {
        const request = new NextRequest('http://localhost/api/playlist', {
          method: 'POST',
          headers: { 'x-test-session': JSON.stringify(mockUserSession) },
          body: JSON.stringify({}), // No description
        });

        const response = await POST(request);
        const responseBody = await response.json();

        expect(response.status).toBe(400);
        expect(responseBody).toEqual({ error: 'Description is required' });
        expect(mockChatCompletionsCreate).not.toHaveBeenCalled();
      });
    });

    describe('Given user is unauthenticated (via x-test-session header)', () => {
      it('should return 401 error when x-test-session is "null"', async () => {
        const request = new NextRequest('http://localhost/api/playlist', {
          method: 'POST',
          headers: { 'x-test-session': 'null' }, // Explicitly null session
          body: JSON.stringify({ description: 'Any description' }),
        });

        const response = await POST(request);
        const responseBody = await response.json();

        expect(response.status).toBe(401);
        expect(responseBody).toEqual({ error: 'User not authenticated or session data incomplete' });
      });

      it('should return 401 error when x-test-session is an empty string (parsed as null)', async () => {
        const request = new NextRequest('http://localhost/api/playlist', {
          method: 'POST',
          headers: { 'x-test-session': '' }, // Session will be null
          body: JSON.stringify({ description: 'Any description' }),
        });

        const response = await POST(request);
        const responseBody = await response.json();

        expect(response.status).toBe(401);
        expect(responseBody).toEqual({ error: 'User not authenticated or session data incomplete' });
      });
    });
  });

  describe('OpenAI API Interaction & Error Handling (User Authenticated)', () => {
    const mockUserSession = { // Consistent session for these tests
      accessToken: 'mock-access-token',
      user: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
    };

    it('should return 500 if OpenAI API call fails', async () => {
      mockChatCompletionsCreate.mockRejectedValueOnce(new Error('OpenAI API Error simulation'));

      const request = new NextRequest('http://localhost/api/playlist', {
        method: 'POST',
        headers: { 'x-test-session': JSON.stringify(mockUserSession) },
        body: JSON.stringify({ description: 'A valid description' }),
      });
      const response = await POST(request);
      const responseBody = await response.json();

      expect(response.status).toBe(500);
      // Error message now comes from the refined catch block in route.ts
      expect(responseBody).toEqual({ error: 'Failed to generate playlist ideas' });
    });

    it('should return 500 if OpenAI returns malformed (non-JSON) content', async () => {
      mockChatCompletionsCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'This is not JSON, this is plain text.' } }],
      });

      const request = new NextRequest('http://localhost/api/playlist', {
        method: 'POST',
        headers: { 'x-test-session': JSON.stringify(mockUserSession) },
        body: JSON.stringify({ description: 'A valid description' }),
      });
      const response = await POST(request);
      const responseBody = await response.json();

      expect(response.status).toBe(500);
      // Error message from JSON.parse failure in route.ts
      expect(responseBody).toEqual({ error: 'Failed to parse playlist ideas' });
    });
  });
});
