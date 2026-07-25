import { SPOTIFY_CLIENT_ID, SPOTIFY_SCOPES } from '../config.js';

const STORAGE_KEYS = {
  verifier: 'spotify_code_verifier',
  token: 'spotify_token',
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

export async function getStoredToken() {
  const { [STORAGE_KEYS.token]: token } = await chrome.storage.local.get(STORAGE_KEYS.token);
  if (!token) return null;
  if (Date.now() >= token.expires_at - 60_000) {
    if (token.refresh_token) {
      return refreshAccessToken(token.refresh_token);
    }
    await chrome.storage.local.remove(STORAGE_KEYS.token);
    return null;
  }
  return token;
}

async function saveToken(data) {
  const token = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
  };
  // Keep previous refresh_token if Spotify omits a new one
  if (!token.refresh_token) {
    const prev = await chrome.storage.local.get(STORAGE_KEYS.token);
    token.refresh_token = prev[STORAGE_KEYS.token]?.refresh_token;
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.token]: token });
  return token;
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
    await chrome.storage.local.remove(STORAGE_KEYS.token);
    throw new Error('Spotify refresh failed');
  }
  return saveToken(await res.json());
}

export function getSpotifyRedirectUri() {
  return chrome.identity.getRedirectURL();
}

export async function loginWithSpotify() {
  if (!SPOTIFY_CLIENT_ID || SPOTIFY_CLIENT_ID.startsWith('REPLACE_')) {
    throw new Error('Set SPOTIFY_CLIENT_ID in extension/config.js');
  }

  // Clear half-finished auth so retries aren't sticky
  await chrome.storage.local.remove([STORAGE_KEYS.verifier]);

  const verifier = randomVerifier();
  const challenge = await challengeFromVerifier(verifier);
  await chrome.storage.local.set({ [STORAGE_KEYS.verifier]: verifier });

  const redirectUri = getSpotifyRedirectUri();
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.set('client_id', SPOTIFY_CLIENT_ID);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', SPOTIFY_SCOPES);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('show_dialog', 'true');

  let responseUrl;
  try {
    responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true,
    });
  } catch (err) {
    const msg = String(err?.message || err);
    if (msg.includes('The user did not approve access') || msg.includes('canceled')) {
      throw new Error('Login cancelled — try Connect again');
    }
    throw new Error(
      `Login stuck/failed. In Spotify Dashboard → Redirect URIs, add EXACTLY:\n${redirectUri}`,
    );
  }

  if (!responseUrl) {
    throw new Error(
      `No redirect back from Spotify. Add this Redirect URI exactly:\n${redirectUri}`,
    );
  }

  const code = new URL(responseUrl).searchParams.get('code');
  if (!code) {
    const errDesc = new URL(responseUrl).searchParams.get('error');
    throw new Error(errDesc ? `Spotify said: ${errDesc}` : 'No auth code from Spotify');
  }

  const { [STORAGE_KEYS.verifier]: storedVerifier } = await chrome.storage.local.get(STORAGE_KEYS.verifier);
  const tokenBody = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: storedVerifier,
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
  await chrome.storage.local.remove(STORAGE_KEYS.verifier);
  return saveToken(await res.json());
}

export async function logoutSpotify() {
  await chrome.storage.local.remove([STORAGE_KEYS.token, STORAGE_KEYS.verifier]);
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
  // Read once — json() then text() throws "Body is disturbed or locked"
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
