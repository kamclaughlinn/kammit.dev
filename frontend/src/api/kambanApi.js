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
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
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

export const kambanApi = {
  createBoard: (board) => request('/kamban/boards', {
    method: 'POST',
    body: JSON.stringify(board),
  }),
  getBoard: (id) => request(`/kamban/boards/${id}`),
  createCard: (columnId, card) => request(`/kamban/columns/${columnId}/cards`, {
    method: 'POST',
    body: JSON.stringify(card),
  }),
  updateCard: (id, card) => request(`/kamban/cards/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(card),
  }),
  moveCard: (id, columnId, position) => request(`/kamban/cards/${id}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ columnId, position }),
  }),
  deleteCard: (id) => request(`/kamban/cards/${id}`, {
    method: 'DELETE',
  }),
};
