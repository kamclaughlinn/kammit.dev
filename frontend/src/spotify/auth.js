import { SPOTIFY_CLIENT_ID, SPOTIFY_SCOPES, getSpotifyRedirectUri } from './config';

const STORAGE_KEYS = {
  verifier: 'kammit_spotify_code_verifier',
  token: 'kammit_spotify_token',
  returnTo: 'kammit_spotify_return',
};

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomVerifier(length = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join('');
}

async function challengeFromVerifier(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

function readToken() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.token);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeToken(token) {
  localStorage.setItem(STORAGE_KEYS.token, JSON.stringify(token));
  return token;
}

async function saveToken(data) {
  const prev = readToken();
  const token = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || prev?.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
  };
  return writeToken(token);
}

async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    localStorage.removeItem(STORAGE_KEYS.token);
    throw new Error('Spotify refresh failed — connect again');
  }
  return saveToken(await res.json());
}

export async function getStoredToken() {
  const token = readToken();
  if (!token) return null;
  if (Date.now() >= token.expires_at - 60_000) {
    if (token.refresh_token) return refreshAccessToken(token.refresh_token);
    localStorage.removeItem(STORAGE_KEYS.token);
    return null;
  }
  return token;
}

/** Start OAuth — full-page redirect to Spotify, then back to /spotify-callback. */
export async function beginSpotifyLogin() {
  if (!SPOTIFY_CLIENT_ID || SPOTIFY_CLIENT_ID.startsWith('REPLACE_')) {
    throw new Error('Set VITE_SPOTIFY_CLIENT_ID');
  }

  const verifier = randomVerifier();
  const challenge = await challengeFromVerifier(verifier);
  sessionStorage.setItem(STORAGE_KEYS.verifier, verifier);
  sessionStorage.setItem(STORAGE_KEYS.returnTo, `${window.location.pathname}${window.location.search}`);

  const redirectUri = getSpotifyRedirectUri();
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.set('client_id', SPOTIFY_CLIENT_ID);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', SPOTIFY_SCOPES);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('show_dialog', 'false');

  window.location.assign(authUrl.toString());
}

/** Finish OAuth on the callback route. */
export async function completeSpotifyLogin(code) {
  const verifier = sessionStorage.getItem(STORAGE_KEYS.verifier);
  if (!verifier) throw new Error('Missing login verifier — try Connect again');

  const redirectUri = getSpotifyRedirectUri();
  const tokenBody = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody,
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      detail = await res.text();
    }
    throw new Error(`Spotify token exchange failed: ${detail}`);
  }

  sessionStorage.removeItem(STORAGE_KEYS.verifier);
  await saveToken(await res.json());
  return sessionStorage.getItem(STORAGE_KEYS.returnTo) || '/';
}

export function logoutSpotify() {
  localStorage.removeItem(STORAGE_KEYS.token);
  sessionStorage.removeItem(STORAGE_KEYS.verifier);
}

export async function spotifyFetch(path, options = {}) {
  const token = await getStoredToken();
  if (!token) throw new Error('Not logged in');
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Read the body once — calling json() then text() throws "Body is disturbed or locked"
  const text = res.status === 204 ? '' : await res.text();

  if (!res.ok) {
    let detail = text;
    if (text) {
      try {
        const body = JSON.parse(text);
        detail =
          body?.error?.message || body?.error_description || JSON.stringify(body);
      } catch {
        // keep raw text
      }
    }
    const err = new Error(`Spotify API ${res.status}${detail ? `: ${detail}` : ''}`);
    err.status = res.status;
    throw err;
  }

  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export { getSpotifyRedirectUri };
