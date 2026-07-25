/**
 * Floating vinyl on kammit.dev — expands in-page (no new tab/window).
 * Full player runs in an extension iframe so Spotify auth/SDK keep working.
 */

const HOST_ID = 'kammit-floating-player-host';

function asset(path) {
  return chrome.runtime.getURL(path);
}

function inject() {
  if (document.getElementById(HOST_ID)) return;

  const host = document.createElement('div');
  host.id = HOST_ID;
  document.documentElement.appendChild(host);

  const root = host.attachShadow({ mode: 'open' });

  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = asset('content/floating-shell.css');
  root.appendChild(style);

  const wrap = document.createElement('div');
  wrap.className = 'kammit-fp';
  wrap.dataset.open = 'false';
  wrap.dataset.ready = 'false';
  wrap.innerHTML = `
    <button type="button" class="fab" aria-label="Open playlist player" aria-expanded="false" title="Playlist player">
      <span class="fab-elvis-wrap">
        <img class="fab-elvis" src="${asset('assets/elvis-cat.png')}" alt="" draggable="false" />
      </span>
      <span class="fab-vinyl" data-spinning="false" aria-hidden="true">
        <span class="fab-label">KAM</span>
      </span>
      <span class="fab-hearts" aria-hidden="true"></span>
    </button>

    <div class="panel" role="dialog" aria-label="KAMmit record player">
      <header class="panel-bar">
        <span class="panel-title">record_player.exe</span>
        <button type="button" class="panel-min" title="Minimize to vinyl" aria-label="Minimize">–</button>
      </header>
      <div class="panel-body">
        <iframe
          class="player-frame"
          title="KAMmit Record Player"
          allow="autoplay; encrypted-media"
        ></iframe>
      </div>
    </div>
  `;
  root.appendChild(wrap);

  const fab = wrap.querySelector('.fab');
  const panelMin = wrap.querySelector('.panel-min');
  const playerFrame = wrap.querySelector('.player-frame');
  const vinyl = wrap.querySelector('.fab-vinyl');
  const hearts = wrap.querySelector('.fab-hearts');

  let booted = false;
  let playing = false;
  let heartTimer = null;

  function ensureFrame() {
    if (booted) return;
    playerFrame.src = `${asset('popup.html')}?embed=1`;
    booted = true;
  }

  function setOpen(open) {
    if (open) ensureFrame();
    wrap.dataset.open = open ? 'true' : 'false';
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    // Iframe stays mounted when minimized so audio continues
    if (open) {
      window.postMessage({ type: 'KAMMIT_PLAYER_ACK' }, '*');
    }
  }

  function toggle() {
    setOpen(wrap.dataset.open !== 'true');
  }

  fab.addEventListener('click', () => setOpen(true));
  panelMin.addEventListener('click', () => setOpen(false));

  function spawnFabHeart() {
    if (!playing || wrap.dataset.open === 'true') return;
    const kind = Math.random() > 0.45 ? 'heart' : 'note';
    const img = document.createElement('img');
    img.className = `fab-px-fx fab-px-${kind}`;
    img.src = asset(kind === 'heart' ? 'assets/pixel-heart.png' : 'assets/pixel-note.png');
    img.alt = '';
    img.draggable = false;
    img.style.setProperty('--x', `${(Math.random() - 0.5) * 28}px`);
    hearts.appendChild(img);
    setTimeout(() => img.remove(), 900);
  }

  function setPlaying(next) {
    playing = Boolean(next);
    vinyl.dataset.spinning = playing ? 'true' : 'false';
    wrap.dataset.playing = playing ? 'true' : 'false';
    if (heartTimer) {
      clearInterval(heartTimer);
      heartTimer = null;
    }
    if (playing) {
      heartTimer = setInterval(spawnFabHeart, 520);
      spawnFabHeart();
    }
  }

  window.addEventListener('message', (event) => {
    if (event.source !== playerFrame.contentWindow) return;
    const data = event.data;
    if (!data || data.type !== 'KAMMIT_PLAYER_STATE') return;
    setPlaying(data.playing);
  });

  window.addEventListener('kammit:open-player', () => setOpen(true));
  window.addEventListener('kammit:toggle-player', toggle);
  window.addEventListener('kammit:close-player', () => setOpen(false));

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || typeof data.type !== 'string') return;
    if (data.type === 'KAMMIT_OPEN_PLAYER') setOpen(true);
    if (data.type === 'KAMMIT_TOGGLE_PLAYER') toggle();
    if (data.type === 'KAMMIT_CLOSE_PLAYER') setOpen(false);
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || !msg.type) return;
    if (msg.type === 'KAMMIT_OPEN_PLAYER') setOpen(true);
    if (msg.type === 'KAMMIT_TOGGLE_PLAYER') toggle();
    if (msg.type === 'KAMMIT_CLOSE_PLAYER') setOpen(false);
  });

  // Prefetch player so first expand is snappy; stays dormant until opened once
  // (src set on first open to avoid Spotify connect before user engages)

  requestAnimationFrame(() => {
    wrap.dataset.ready = 'true';
  });
}

inject();
