/**
 * Public shrine playlist — YouTube playlist embed (full play for visitors).
 *
 * Paste the list= ID from a youtube.com playlist URL, e.g.
 *   https://www.youtube.com/playlist?list=PLxxxxxxxx
 *                                         ^^^^^^^^^^
 *
 * Or set VITE_YOUTUBE_PLAYLIST_ID in frontend/.env
 *
 * Note: YouTube *Music* links don’t embed — use a normal youtube.com playlist.
 */
export const YOUTUBE_PLAYLIST_ID =
  import.meta.env.VITE_YOUTUBE_PLAYLIST_ID || 'PLWklLPmGhoI8';

/** @deprecated use YOUTUBE_PLAYLIST_ID */
export const SPOTIFY_PLAYLIST_ID = YOUTUBE_PLAYLIST_ID;

export function getYoutubeEmbedUrl(playlistId = YOUTUBE_PLAYLIST_ID) {
  const id = encodeURIComponent(playlistId);
  return `https://www.youtube-nocookie.com/embed/videoseries?list=${id}&rel=0`;
}

/** @deprecated use getYoutubeEmbedUrl */
export function getSpotifyEmbedUrl(playlistId = YOUTUBE_PLAYLIST_ID) {
  return getYoutubeEmbedUrl(playlistId);
}
