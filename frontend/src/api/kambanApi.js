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

function withAdmin(adminKey, options = {}) {
  return {
    ...options,
    headers: {
      ...options.headers,
      ...(adminKey ? { 'X-Admin-Key': adminKey } : {}),
    },
  };
}

export const kambanApi = {
  createBoard: (board, adminKey) => request('/kamban/boards', withAdmin(adminKey, {
    method: 'POST',
    body: JSON.stringify(board),
  })),
  getBoard: (id) => request(`/kamban/boards/${id}`),
  createCard: (columnId, card, adminKey) => request(`/kamban/columns/${columnId}/cards`, withAdmin(adminKey, {
    method: 'POST',
    body: JSON.stringify(card),
  })),
  updateCard: (id, card, adminKey) => request(`/kamban/cards/${id}`, withAdmin(adminKey, {
    method: 'PATCH',
    body: JSON.stringify(card),
  })),
  moveCard: (id, columnId, position, adminKey) => request(`/kamban/cards/${id}/move`, withAdmin(adminKey, {
    method: 'PATCH',
    body: JSON.stringify({ columnId, position }),
  })),
  deleteCard: (id, adminKey) => request(`/kamban/cards/${id}`, withAdmin(adminKey, {
    method: 'DELETE',
  })),
};
