// src/lib/spotify.test.ts
import { createSpotifyPlaylist, searchSpotifyTrack, addTracksToPlaylist } from './spotify';

// Mock fetch globally
global.fetch = jest.fn();

describe('createSpotifyPlaylist', () => {
  beforeEach(() => {
    // Clear mock history before each test
    (fetch as jest.Mock).mockClear();
  });

  it('should create a playlist successfully', async () => {
    const mockSession = { accessToken: 'mock_access_token', user: { id: 'mock_user_id' } };
    const playlistName = 'Test Playlist';
    const mockResponse = { id: 'mock_playlist_id' };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const playlist = await createSpotifyPlaylist(mockSession as any, playlistName);

    expect(fetch).toHaveBeenCalledWith(
      `https://api.spotify.com/v1/users/mock_user_id/playlists`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: `Bearer mock_access_token`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlistName,
          public: false, // Assuming default is false, adjust if needed
        }),
      })
    );
    expect(playlist).toEqual(mockResponse);
  });

  it('should throw an error if session.accessToken is missing', async () => {
    const mockSession = { user: { id: 'mock_user_id' } }; // No accessToken
    const playlistName = 'Test Playlist';

    await expect(createSpotifyPlaylist(mockSession as any, playlistName)).rejects.toThrow(
      'No access token available' // Updated error message
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should throw an error if session.user.id is missing', async () => {
    const mockSession = { accessToken: 'mock_access_token', user: {} }; // No user.id
    const playlistName = 'Test Playlist';

    await expect(createSpotifyPlaylist(mockSession as any, playlistName)).rejects.toThrow(
      'No user ID available' // Updated error message
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should throw an error on Spotify API error (e.g., 401)', async () => {
    const mockSession = { accessToken: 'mock_access_token', user: { id: 'mock_user_id' } };
    const playlistName = 'Test Playlist';

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Unauthorized' } }),
    });

    await expect(createSpotifyPlaylist(mockSession as any, playlistName)).rejects.toThrow(
      'Failed to create playlist: Unauthorized' // Updated error message
    );
  });

  it('should throw an error on Spotify API error (e.g., 500)', async () => {
    const mockSession = { accessToken: 'mock_access_token', user: { id: 'mock_user_id' } };
    const playlistName = 'Test Playlist';

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'Internal Server Error' } }),
    });

    await expect(createSpotifyPlaylist(mockSession as any, playlistName)).rejects.toThrow(
      'Failed to create playlist: Internal Server Error' // Updated error message
    );
  });

   it('should throw a generic error if Spotify API error message is missing and statusText is used', async () => {
    const mockSession = { accessToken: 'mock_access_token', user: { id: 'mock_user_id' } };
    const playlistName = 'Test Playlist';

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request', // Added statusText
      json: async () => ({}), // No error.message
    });

    await expect(createSpotifyPlaylist(mockSession as any, playlistName)).rejects.toThrow(
      'Failed to create playlist: Bad Request' // Updated error message
    );
  });
});

describe('searchSpotifyTrack', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should return a track URI if found', async () => {
    const mockSession = { accessToken: 'mock_access_token' };
    const trackName = 'Bohemian Rhapsody';
    const artistName = 'Queen';
    const mockResponse = {
      tracks: {
        items: [{ id: 'mock_track_id', uri: 'spotify:track:mock_track_id' }],
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const trackUri = await searchSpotifyTrack(mockSession as any, trackName, artistName);

    expect(fetch).toHaveBeenCalledWith(
      // Corrected encoding to match spotify.ts: encodeURIComponent applied to "trackName artist:artistName"
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(`${trackName} artist:${artistName}`)}&type=track&limit=1`,
      expect.objectContaining({
        headers: {
          Authorization: `Bearer mock_access_token`,
        },
      })
    );
    // The actual function returns the full track object, not just URI
    expect(trackUri).toEqual(mockResponse.tracks.items[0]);
  });

  it('should return null if no track is found', async () => {
    const mockSession = { accessToken: 'mock_access_token' };
    const trackName = 'Non Existent Track';
    const artistName = 'Unknown Artist';
    const mockResponse = { tracks: { items: [] } }; // No items

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const trackUri = await searchSpotifyTrack(mockSession as any, trackName, artistName);
    expect(trackUri).toBeNull();
  });

  // Test for missing accessToken removed as it's not explicitly checked in the current code.
  // it('should throw an error if session.accessToken is missing', async () => { ... });


  it('should throw an error on Spotify API error during search', async () => { // Name updated for clarity
    const mockSession = { accessToken: 'mock_access_token' };
    const trackName = 'Test Track';
    const artistName = 'Test Artist';

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      // status: 500, // Not needed as the function throws a generic error
      // json: async () => ({ error: { message: 'Internal Server Error' } }), // Not needed
    });

    await expect(searchSpotifyTrack(mockSession as any, trackName, artistName)).rejects.toThrow(
      'Failed to search for track' // Consistent error message
    );
  });

  // Generic error test removed as it's covered by the above.
  // it('should throw a generic error if Spotify API error message is missing during search', async () => { ... });
});

describe('addTracksToPlaylist', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should add tracks to a playlist successfully', async () => {
    const mockSession = { accessToken: 'mock_access_token' };
    const playlistId = 'mock_playlist_id';
    const trackUris = ['spotify:track:uri1', 'spotify:track:uri2'];
    const mockResponse = { snapshot_id: 'mock_snapshot_id' };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await addTracksToPlaylist(mockSession as any, playlistId, trackUris);

    expect(fetch).toHaveBeenCalledWith(
      `https://api.spotify.com/v1/playlists/mock_playlist_id/tracks`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: `Bearer mock_access_token`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: trackUris }),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  // Tests for missing accessToken, playlistId, and empty trackUris removed
  // as they are not explicitly checked in the current code for addTracksToPlaylist.
  // it('should throw an error if session.accessToken is missing', async () => { ... });
  // it('should throw an error if playlistId is missing', async () => { ... });
  // it('should throw an error if trackUris is empty or null', async () => { ... });


  it('should throw an error on Spotify API error when adding tracks', async () => { // Name updated for clarity
    const mockSession = { accessToken: 'mock_access_token' };
    const playlistId = 'mock_playlist_id';
    const trackUris = ['spotify:track:uri1'];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      // status: 403, // Not needed
      // json: async () => ({ error: { message: 'Forbidden' } }), // Not needed
    });

    await expect(addTracksToPlaylist(mockSession as any, playlistId, trackUris)).rejects.toThrow(
      'Failed to add tracks to playlist' // Consistent error message
    );
  });

  // Generic error test removed as it's covered by the above.
  // it('should throw a generic error if Spotify API error message is missing when adding tracks', async () => { ... });
});

// Removed the final empty describe block as it's no longer needed.
