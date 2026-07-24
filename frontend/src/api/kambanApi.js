const API_BASE = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? 'https://kammit-api.onrender.com/api' : '/api');

async function request(path, options = {}) {
  const headers = { ...options.headers };
  if (options.method && options.method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
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
