/**
 * Paste your Spotify App Client ID from https://developer.spotify.com/dashboard
 * Redirect URI must be: https://<YOUR_EXTENSION_ID>.chromiumapp.org/
 * (Chrome → Extensions → KAMmit Record Player → copy ID)
 */
export const SPOTIFY_CLIENT_ID = '60d2c101c7f34a7eaccb631185b2f43a';

export const SPOTIFY_SCOPES = [
  'user-read-email',
  'user-read-private',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ');
