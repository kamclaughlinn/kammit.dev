/**
 * Public shrine playlist — Spotify embed, no login / allowlist needed.
 * Override with VITE_SPOTIFY_PLAYLIST_ID if you swap playlists.
 */
export const SPOTIFY_PLAYLIST_ID =
  import.meta.env.VITE_SPOTIFY_PLAYLIST_ID || '4bFqUzph32Ujw03m2K2h4U?';

export function getSpotifyEmbedUrl(playlistId = SPOTIFY_PLAYLIST_ID) {
  const id = encodeURIComponent(playlistId);
  return `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`;
}
