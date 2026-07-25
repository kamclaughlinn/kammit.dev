/** Toggle the in-page floating player on kammit.dev tabs only. */

const ALLOWED_HOSTS = new Set([
  'kammit.dev',
  'www.kammit.dev',
  'localhost',
  '127.0.0.1',
  'kamclaughlinn.github.io',
]);

function isAllowedUrl(urlString) {
  try {
    return ALLOWED_HOSTS.has(new URL(urlString).hostname);
  } catch {
    return false;
  }
}

async function togglePlayerOnTab(tab) {
  if (!tab?.id || !tab.url || !isAllowedUrl(tab.url)) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'KAMMIT_TOGGLE_PLAYER' });
  } catch {
    // Content script not ready — ignore
  }
}

chrome.action.onClicked.addListener((tab) => {
  togglePlayerOnTab(tab);
});
