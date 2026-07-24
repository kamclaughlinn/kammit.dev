const API_BASE = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? 'https://kammit-api.onrender.com/api' : '/api');

const REQUEST_TIMEOUT_MS = 45_000;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 3_000;

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
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  } catch (err) {
    if (attempt < RETRY_ATTEMPTS) {
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
  teach: (phrase) => request('/elvis/teach', {
    method: 'POST',
    body: JSON.stringify({ phrase }),
  }),
  chat: (message) => request('/elvis/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),
};
