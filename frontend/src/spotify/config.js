/** Public Spotify app Client ID (PKCE — no secret). Override with VITE_SPOTIFY_CLIENT_ID. */
export const SPOTIFY_CLIENT_ID =
  import.meta.env.VITE_SPOTIFY_CLIENT_ID || '60d2c101c7f34a7eaccb631185b2f43a';

export const SPOTIFY_SCOPES = [
  'user-read-email',
  'user-read-private',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ');

/** Exact redirect URIs to add in Spotify Developer Dashboard. */
export function getSpotifyRedirectUri() {
  return new URL('spotify-callback', window.location.origin + import.meta.env.BASE_URL).href;
}
