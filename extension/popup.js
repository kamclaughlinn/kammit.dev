import {
  getSpotifyRedirectUri,
  getStoredToken,
  loginWithSpotify,
  logoutSpotify,
  spotifyFetch,
} from './lib/spotify-auth.js';
import { formatMs, parseSpotifyPlaylistUrl } from './lib/playlist.js';

const embedded = new URLSearchParams(window.location.search).has('embed');
if (embedded) {
  document.documentElement.dataset.embed = 'true';
}

function broadcastPlaying(playing) {
  if (!embedded || window.parent === window) return;
  window.parent.postMessage(
    { type: 'KAMMIT_PLAYER_STATE', playing: Boolean(playing) },
    '*',
  );
}

const els = {
  trackName: document.getElementById('track-name'),
  trackArtist: document.getElementById('track-artist'),
  trackAlbum: document.getElementById('track-album'),
  trackIndex: document.getElementById('track-index'),
  timeElapsed: document.getElementById('time-elapsed'),
  timeLeft: document.getElementById('time-left'),
  timeTotal: document.getElementById('time-total'),
  progressFill: document.getElementById('progress-fill'),
  progressTrack: document.getElementById('progress-track'),
  heart: document.getElementById('heart-scrubber'),
  platter: document.getElementById('platter'),
  tonearm: document.getElementById('tonearm'),
  elvisWrap: document.getElementById('elvis-wrap'),
  fxLayer: document.getElementById('fx-layer'),
  status: document.getElementById('status'),
  playlistUrl: document.getElementById('playlist-url'),
  btnLogin: document.getElementById('btn-login'),
  btnLogout: document.getElementById('btn-logout'),
  btnLoad: document.getElementById('btn-load'),
  btnPlay: document.getElementById('btn-play'),
  btnPrev: document.getElementById('btn-prev'),
  btnNext: document.getElementById('btn-next'),
};

let player = null;
let deviceId = null;
let playlistId = null;
let playlistContextUri = null;
let playlistName = '';
let playlistTotal = null;
let tracks = [];
let currentIndex = 0;
let durationMs = 0;
let positionMs = 0;
let isPaused = true;
let pollTimer = null;
let beatTimer = null;
let bpm = 112;
let lastTempoTrackId = null;

function setStatus(msg) {
  els.status.textContent = msg || '';
}

function setAuthUi(loggedIn) {
  els.btnLogin.classList.toggle('hidden', loggedIn);
  els.btnLogout.classList.toggle('hidden', !loggedIn);
}

function updateMeta(track) {
  if (!track) {
    els.trackName.textContent = 'No track yet';
    els.trackArtist.textContent = 'Connect Spotify & paste a playlist or album';
    els.trackAlbum.textContent = '—';
    els.trackIndex.textContent = 'song — / —';
    return;
  }
  els.trackName.textContent = track.name || 'Unknown track';
  els.trackArtist.textContent =
    (track.artists || []).map((a) => a.name).join(', ') || 'Unknown artist';
  els.trackAlbum.textContent = track.album?.name || '—';

  const total = tracks.length || playlistTotal;
  if (tracks.length) {
    els.trackIndex.textContent = `song ${currentIndex + 1} / ${tracks.length}`;
  } else if (total) {
    els.trackIndex.textContent = `playlist · ${total} songs`;
  } else {
    els.trackIndex.textContent = playlistName
      ? `playing · ${playlistName}`
      : 'playing from playlist';
  }
}

function spawnBeatFx() {
  if (!els.fxLayer) return;
  const kind = Math.random() > 0.45 ? 'heart' : 'note';
  const node = document.createElement('span');
  node.className = `pixel-fx ${kind}`;
  node.style.left = `${18 + Math.random() * 64}%`;
  node.style.bottom = `${36 + Math.random() * 18}%`;
  node.style.setProperty('--drift', `${Math.round((Math.random() - 0.5) * 36)}px`);
  const img = document.createElement('img');
  img.className = kind === 'heart' ? 'pixel-heart' : 'pixel-note';
  img.src = kind === 'heart' ? 'assets/pixel-heart.png' : 'assets/pixel-note.png';
  img.alt = '';
  img.draggable = false;
  node.appendChild(img);
  els.fxLayer.appendChild(node);
  setTimeout(() => node.remove(), 1200);
}

function onBeat() {
  if (isPaused) return;
  spawnBeatFx();
  if (!els.elvisWrap) return;
  els.elvisWrap.classList.remove('beat');
  // force reflow so beat animation can restart
  void els.elvisWrap.offsetWidth;
  els.elvisWrap.classList.add('beat');
}

function stopBeatLoop() {
  if (beatTimer) {
    clearInterval(beatTimer);
    beatTimer = null;
  }
}

function startBeatLoop() {
  stopBeatLoop();
  const interval = Math.max(280, Math.min(900, 60000 / bpm));
  beatTimer = setInterval(onBeat, interval);
  onBeat();
}

function setPlayingVisuals(playing) {
  const wasPlaying = els.platter.dataset.spinning === 'true';
  els.platter.dataset.spinning = playing ? 'true' : 'false';
  els.tonearm.dataset.down = playing ? 'true' : 'false';
  els.elvisWrap.dataset.playing = playing ? 'true' : 'false';
  if (playing && !wasPlaying) startBeatLoop();
  if (!playing && wasPlaying) {
    stopBeatLoop();
    els.elvisWrap.classList.remove('beat');
  }
  if (wasPlaying !== playing) broadcastPlaying(playing);
}

async function syncTempoFromTrack(track) {
  const id = track?.id || track?.uri?.split(':').pop();
  if (!id || id === lastTempoTrackId) return;
  lastTempoTrackId = id;
  try {
    const features = await spotifyFetch(`/audio-features/${id}`);
    if (features?.tempo && Number.isFinite(features.tempo)) {
      bpm = Math.max(72, Math.min(176, features.tempo));
    } else {
      bpm = 112;
    }
  } catch {
    // Audio features often 403 on newer Spotify apps — fall back
    bpm = 112;
  }
  if (!isPaused) startBeatLoop();
}

function updateProgress(position, duration, paused) {
  positionMs = position ?? 0;
  durationMs = duration ?? 0;
  isPaused = Boolean(paused);

  const pct = durationMs > 0 ? Math.min(100, (positionMs / durationMs) * 100) : 0;
  els.progressFill.style.width = `${pct}%`;
  els.heart.style.left = `${pct}%`;
  els.progressTrack.setAttribute('aria-valuenow', String(Math.round(pct)));

  els.timeElapsed.textContent = formatMs(positionMs);
  els.timeTotal.textContent = formatMs(durationMs);
  els.timeLeft.textContent = `−${formatMs(Math.max(0, durationMs - positionMs))}`;

  els.btnPlay.textContent = isPaused ? '▶' : '❚❚';
  setPlayingVisuals(!isPaused && durationMs > 0);
}

async function refreshAuthUi() {
  const token = await getStoredToken();
  setAuthUi(Boolean(token));
  if (token && !player) {
    try {
      setStatus('Starting player…');
      await initPlayer();
    } catch (err) {
      setStatus(err.message || 'Player failed to start');
    }
  }
}

function waitForSpotifySdk(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (window.Spotify?.Player) {
      resolve();
      return;
    }
    const prev = window.onSpotifyWebPlaybackSDKReady;
    const timer = setTimeout(() => {
      reject(
        new Error(
          'Spotify player SDK missing — reload the extension (vendor/spotify-player.js must load)',
        ),
      );
    }, timeoutMs);
    window.onSpotifyWebPlaybackSDKReady = () => {
      clearTimeout(timer);
      if (typeof prev === 'function') prev();
      resolve();
    };
  });
}

async function initPlayer() {
  if (player) return player;

  await waitForSpotifySdk();
  const token = await getStoredToken();
  if (!token) throw new Error('Connect Spotify first');

  player = new Spotify.Player({
    name: 'KAMmit Record Player',
    getOAuthToken: async (cb) => {
      const t = await getStoredToken();
      cb(t?.access_token);
    },
    volume: 0.8,
  });

  player.addListener('ready', ({ device_id }) => {
    deviceId = device_id;
    setStatus('Record player ready ♥');
  });

  player.addListener('not_ready', () => {
    deviceId = null;
    setStatus('Player went offline');
  });

  player.addListener('initialization_error', ({ message }) => {
    setStatus(`Player init error: ${message}`);
  });

  player.addListener('authentication_error', ({ message }) => {
    setStatus(`Auth error: ${message}`);
  });

  player.addListener('account_error', ({ message }) => {
    setStatus(`Premium required?: ${message}`);
  });

  player.addListener('player_state_changed', (state) => {
    if (!state) {
      updateProgress(0, durationMs, true);
      return;
    }
    const track = state.track_window?.current_track;
    if (track) {
      const uri = track.uri;
      const idx = tracks.findIndex((t) => t.uri === uri);
      if (idx >= 0) currentIndex = idx;
      updateMeta({
        name: track.name,
        artists: track.artists,
        album: track.album,
      });
      syncTempoFromTrack(track);
    }
    updateProgress(state.position, state.duration, state.paused);
  });

  const ok = await player.connect();
  if (!ok) {
    player = null;
    throw new Error('Could not connect player — try Log out → Connect Spotify again');
  }
  return player;
}

async function ensurePlayer() {
  const token = await getStoredToken();
  if (!token) throw new Error('Connect Spotify first');
  if (!player) {
    setStatus('Starting player…');
    await initPlayer();
  }
  return player;
}

async function loadPlaylist() {
  const parsed = parseSpotifyPlaylistUrl(els.playlistUrl.value);
  if (!parsed) {
    setStatus('Paste a Spotify playlist or album URL');
    return;
  }

  const { type, id } = parsed;
  playlistId = id;
  playlistContextUri = `spotify:${type}:${id}`;
  tracks = [];
  currentIndex = 0;
  playlistTotal = null;
  playlistName = '';
  setStatus(type === 'album' ? 'Loading album…' : 'Loading playlist…');

  if (type === 'album') {
    try {
      const meta = await spotifyFetch(`/albums/${id}?market=from_token`);
      playlistName = meta.name || '';
      playlistTotal = meta.total_tracks ?? meta.tracks?.total ?? null;
      const albumArtists = meta.artists || [];
      tracks = (meta.tracks?.items || [])
        .filter((t) => t && t.uri && !t.is_local)
        .map((t) => ({
          ...t,
          // album track objects often omit album/artists nest — fill for UI
          artists: t.artists?.length ? t.artists : albumArtists,
          album: { name: playlistName, images: meta.images },
        }));
    } catch (err) {
      // Still try context play if meta fails
      if (err.status && err.status !== 404) {
        // keep going — play via context_uri
      }
      tracks = [];
    }
  } else {
    try {
      const meta = await spotifyFetch(`/playlists/${id}`);
      playlistName = meta.name || '';
      playlistTotal = meta.items?.total ?? meta.tracks?.total ?? null;
    } catch {
      // play via context_uri still works
    }

    try {
      const data = await spotifyFetch(
        `/playlists/${id}/items?limit=50&market=from_token`,
      );
      tracks = (data.items || [])
        .map((row) => row.item || row.track)
        .filter((t) => t && t.type === 'track' && t.uri && !t.is_local);
    } catch (err) {
      if (err.status !== 403) throw err;
      tracks = [];
    }
  }

  await chrome.storage.local.set({ last_playlist_url: els.playlistUrl.value });

  const kindLabel = type === 'album' ? 'Album' : 'Playlist';
  if (tracks.length) {
    updateMeta(tracks[0]);
    updateProgress(0, tracks[0].duration_ms || 0, true);
    setStatus(`Loaded ${tracks.length} tracks — hit play`);
  } else {
    updateMeta({
      name: playlistName || `${kindLabel} ready`,
      artists: [{ name: 'Hit play to start' }],
      album: { name: '—' },
    });
    updateProgress(0, 0, true);
    setStatus(
      playlistTotal
        ? `Ready (${playlistTotal} songs). Hit ▶`
        : 'Ready — hit ▶',
    );
  }
}

async function waitForDevice(timeoutMs = 4000) {
  const start = Date.now();
  while (!deviceId && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!deviceId) {
    throw new Error(
      'Player device not ready — click Connect Spotify again and wait for “ready ♥”',
    );
  }
  return deviceId;
}

async function playCurrent() {
  await ensurePlayer();
  if (!playlistContextUri && !tracks.length) {
    throw new Error('Load a playlist or album first');
  }

  await waitForDevice();

  if (typeof player.activateElement === 'function') {
    try {
      await player.activateElement();
    } catch {
      // ignore
    }
  }

  try {
    await spotifyFetch('/me/player', {
      method: 'PUT',
      body: JSON.stringify({ device_ids: [deviceId], play: false }),
    });
  } catch {
    // ignore — first /play will claim the device
  }

  const body = playlistContextUri
    ? {
        context_uri: playlistContextUri,
        ...(tracks.length ? { offset: { position: currentIndex } } : {}),
      }
    : {
        uris: tracks.map((t) => t.uri),
        offset: { position: currentIndex },
        position_ms: 0,
      };

  await spotifyFetch(`/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  setStatus('Playing ♥');
}

async function togglePlay() {
  try {
    await ensurePlayer();
  } catch (err) {
    setStatus(err.message || 'Connect Spotify first');
    return;
  }
  if (!playlistContextUri && !tracks.length) {
    setStatus('Load a playlist or album first');
    return;
  }

  try {
    if (typeof player.activateElement === 'function') {
      await player.activateElement();
    }

    const state = await player.getCurrentState();
    if (!state) {
      setStatus('Starting playback…');
      await playCurrent();
      return;
    }

    await player.togglePlay();
  } catch (err) {
    try {
      setStatus('Retrying play via Spotify…');
      await playCurrent();
    } catch (err2) {
      setStatus(err2.message || err.message || 'Play failed');
    }
  }
}

async function nextTrack() {
  if (!player) return;
  if (!playlistContextUri && !tracks.length) return;
  const state = await player.getCurrentState();
  if (!state) {
    await playCurrent();
    return;
  }
  await player.nextTrack();
}

async function prevTrack() {
  if (!player) return;
  if (!playlistContextUri && !tracks.length) return;
  const state = await player.getCurrentState();
  if (!state) {
    await playCurrent();
    return;
  }
  await player.previousTrack();
}

function seekFromEvent(event) {
  if (!durationMs || !player) return;
  const rect = els.progressTrack.getBoundingClientRect();
  const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
  const pct = x / rect.width;
  const ms = Math.floor(pct * durationMs);
  player.seek(ms);
  updateProgress(ms, durationMs, isPaused);
}

els.btnLogin.addEventListener('click', async () => {
  try {
    const redirectUri = getSpotifyRedirectUri();
    setStatus(`Opening Spotify… (redirect must be: ${redirectUri})`);
    els.btnLogin.disabled = true;
    await loginWithSpotify();
    setAuthUi(true);
    setStatus('Logged in — starting player…');
    await initPlayer();
    setStatus('Connected ♥');
  } catch (err) {
    setStatus(err.message || 'Login failed');
  } finally {
    els.btnLogin.disabled = false;
  }
});

els.btnLogout.addEventListener('click', async () => {
  stopBeatLoop();
  if (player) {
    player.disconnect();
    player = null;
    deviceId = null;
  }
  await logoutSpotify();
  setAuthUi(false);
  updateMeta(null);
  updateProgress(0, 0, true);
  setStatus('Logged out');
});

els.btnLoad.addEventListener('click', async () => {
  try {
    await loadPlaylist();
  } catch (err) {
    setStatus(err.message || 'Load failed — are you logged in?');
  }
});

els.btnPlay.addEventListener('click', async () => {
  try {
    await togglePlay();
  } catch (e) {
    setStatus(e.message || 'Play failed');
  }
});
els.btnNext.addEventListener('click', () => nextTrack().catch((e) => setStatus(e.message)));
els.btnPrev.addEventListener('click', () => prevTrack().catch((e) => setStatus(e.message)));

els.progressTrack.addEventListener('click', seekFromEvent);

chrome.storage.local.get('last_playlist_url').then((data) => {
  if (data.last_playlist_url) els.playlistUrl.value = data.last_playlist_url;
});

refreshAuthUi();

pollTimer = setInterval(async () => {
  if (!player || isPaused) return;
  const state = await player.getCurrentState();
  if (state) updateProgress(state.position, state.duration, state.paused);
}, 1000);
