const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
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
