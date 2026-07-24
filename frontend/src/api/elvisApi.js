const API_BASE = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? 'https://kammit-api.onrender.com/api' : '/api');

const REQUEST_TIMEOUT_MS = 30_000;
const RETRY_ATTEMPTS = 6;
const RETRY_DELAY_MS = 5_000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options = {}, attempt = 1) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers = { ...options.headers };
  if (options.method && options.method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = new Error(`API error: ${res.status}`);
      err.status = res.status;
      throw err;
    }

    if (res.status === 204) return null;
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch (err) {
    const status = err?.status;
    const shouldRetry = (!status || status >= 500) && attempt < RETRY_ATTEMPTS;
    if (shouldRetry) {
      await sleep(RETRY_DELAY_MS);
      return request(path, options, attempt + 1);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export const elvisApi = {
  getState: () => request('/elvis'),
  feed: () => request('/elvis/feed', { method: 'POST' }),
  pet: () => request('/elvis/pet', { method: 'POST' }),
  play: () => request('/elvis/play', { method: 'POST' }),
  clean: () => request('/elvis/clean', { method: 'POST' }),
  heart: () => request('/elvis/heart', { method: 'POST' }),
  getPhrases: () => request('/elvis/phrases'),
  teach: (phrase, authorName) => request('/elvis/teach', {
    method: 'POST',
    body: JSON.stringify({ phrase, authorName }),
  }),
  deletePhrase: (id, adminKey) => request(`/elvis/phrases/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  }),
  verifyAdmin: (adminKey) => request('/elvis/admin/verify', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
  }),
  chat: (message) => request('/elvis/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),
};
