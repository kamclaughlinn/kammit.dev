const API_BASE = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? 'https://kammit-api.onrender.com/api' : '/api');

const REQUEST_TIMEOUT_MS = 90_000;

export async function runCrawl({ startUrl, maxPages = 12 }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}/crawler/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startUrl, maxPages }),
      signal: controller.signal,
    });

    const text = await res.text();
    let body = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { message: text };
      }
    }

    if (!res.ok) {
      const message = body?.message || body?.error || `Crawl failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }

    return body;
  } finally {
    clearTimeout(timeout);
  }
}
