/**
 * Parse Spotify playlist / album URLs into { type, id }.
 */
export function parseSpotifyUrl(input) {
  const raw = (input || '').trim();
  if (!raw) return null;

  const uriMatch = raw.match(/^spotify:(playlist|album):([a-zA-Z0-9]+)$/i);
  if (uriMatch) {
    return { type: uriMatch[1].toLowerCase(), id: uriMatch[2] };
  }

  try {
    const url = new URL(raw);
    if (!url.hostname.includes('spotify.com')) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    for (const type of ['playlist', 'album']) {
      const idx = parts.indexOf(type);
      if (idx >= 0 && parts[idx + 1]) {
        return { type, id: parts[idx + 1].split('?')[0] };
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function formatMs(ms) {
  if (ms == null || Number.isNaN(ms)) return '0:00';
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
