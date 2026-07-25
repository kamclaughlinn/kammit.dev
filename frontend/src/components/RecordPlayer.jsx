import { useCallback, useEffect, useRef, useState } from 'react';
import ElvisCat from './ElvisCat';
import {
  beginSpotifyLogin,
  getStoredToken,
  getSpotifyRedirectUri,
  logoutSpotify,
  spotifyFetch,
} from '../spotify/auth';
import { formatMs, parseSpotifyUrl } from '../spotify/playlist';
import { loadSpotifySdk } from '../spotify/loadSdk';
import './RecordPlayer.css';

const HEART_SRC = `${import.meta.env.BASE_URL}spotify/pixel-heart.png`;
const NOTE_SRC = `${import.meta.env.BASE_URL}spotify/pixel-note.png`;
const LAST_URL_KEY = 'kammit_last_spotify_url';

function emptyMeta() {
  return {
    name: 'No track yet',
    artist: 'Connect Spotify & paste a playlist or album',
    album: '—',
    index: 'song — / —',
  };
}

export default function RecordPlayer() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [status, setStatus] = useState('');
  const [url, setUrl] = useState(() => localStorage.getItem(LAST_URL_KEY) || '');
  const [meta, setMeta] = useState(emptyMeta);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [paused, setPaused] = useState(true);
  const [fabFx, setFabFx] = useState([]);
  const [stageFx, setStageFx] = useState([]);
  const [elvisBeat, setElvisBeat] = useState(false);

  const playerRef = useRef(null);
  const deviceIdRef = useRef(null);
  const contextUriRef = useRef(null);
  const tracksRef = useRef([]);
  const currentIndexRef = useRef(0);
  const playlistNameRef = useRef('');
  const playlistTotalRef = useRef(null);
  const bpmRef = useRef(112);
  const lastTempoIdRef = useRef(null);
  const beatTimerRef = useRef(null);
  const fabHeartTimerRef = useRef(null);
  const pausedRef = useRef(true);
  const elvisWrapRef = useRef(null);
  const progressRef = useRef(null);

  const playing = !paused && durationMs > 0;

  const applyMeta = useCallback((track, tracks, playlistName, playlistTotal, currentIndex) => {
    if (!track) {
      setMeta(emptyMeta());
      return;
    }
    let index = 'playing from playlist';
    if (tracks.length) index = `song ${currentIndex + 1} / ${tracks.length}`;
    else if (playlistTotal) index = `playlist · ${playlistTotal} songs`;
    else if (playlistName) index = `playing · ${playlistName}`;

    setMeta({
      name: track.name || 'Unknown track',
      artist: (track.artists || []).map((a) => a.name).join(', ') || 'Unknown artist',
      album: track.album?.name || '—',
      index,
    });
  }, []);

  const stopBeatLoop = useCallback(() => {
    if (beatTimerRef.current) {
      clearInterval(beatTimerRef.current);
      beatTimerRef.current = null;
    }
  }, []);

  const spawnStageFx = useCallback(() => {
    const kind = Math.random() > 0.45 ? 'heart' : 'note';
    const id = `${Date.now()}-${Math.random()}`;
    setStageFx((prev) => [
      ...prev.slice(-12),
      {
        id,
        kind,
        left: `${18 + Math.random() * 64}%`,
        bottom: `${36 + Math.random() * 18}%`,
        drift: `${Math.round((Math.random() - 0.5) * 36)}px`,
      },
    ]);
    setTimeout(() => {
      setStageFx((prev) => prev.filter((f) => f.id !== id));
    }, 1200);
  }, []);

  const onBeat = useCallback(() => {
    if (pausedRef.current) return;
    spawnStageFx();
    setElvisBeat(true);
    requestAnimationFrame(() => {
      setTimeout(() => setElvisBeat(false), 180);
    });
  }, [spawnStageFx]);

  const startBeatLoop = useCallback(() => {
    stopBeatLoop();
    const interval = Math.max(280, Math.min(900, 60000 / bpmRef.current));
    beatTimerRef.current = setInterval(onBeat, interval);
    onBeat();
  }, [onBeat, stopBeatLoop]);

  useEffect(() => {
    pausedRef.current = paused;
    if (playing) startBeatLoop();
    else stopBeatLoop();
  }, [playing, paused, startBeatLoop, stopBeatLoop]);

  useEffect(() => {
    if (!playing || open) {
      if (fabHeartTimerRef.current) {
        clearInterval(fabHeartTimerRef.current);
        fabHeartTimerRef.current = null;
      }
      return undefined;
    }
    const spawn = () => {
      const kind = Math.random() > 0.45 ? 'heart' : 'note';
      const id = `${Date.now()}-${Math.random()}`;
      setFabFx((prev) => [
        ...prev.slice(-8),
        { id, kind, x: `${(Math.random() - 0.5) * 28}px` },
      ]);
      setTimeout(() => setFabFx((prev) => prev.filter((f) => f.id !== id)), 900);
    };
    fabHeartTimerRef.current = setInterval(spawn, 520);
    spawn();
    return () => {
      clearInterval(fabHeartTimerRef.current);
      fabHeartTimerRef.current = null;
    };
  }, [playing, open]);

  const syncTempoFromTrack = useCallback(
    async (track) => {
      const id = track?.id || track?.uri?.split(':').pop();
      if (!id || id === lastTempoIdRef.current) return;
      lastTempoIdRef.current = id;
      try {
        const features = await spotifyFetch(`/audio-features/${id}`);
        if (features?.tempo && Number.isFinite(features.tempo)) {
          bpmRef.current = Math.max(72, Math.min(176, features.tempo));
        } else {
          bpmRef.current = 112;
        }
      } catch {
        bpmRef.current = 112;
      }
      if (!pausedRef.current) startBeatLoop();
    },
    [startBeatLoop],
  );

  const updateFromState = useCallback(
    (state) => {
      if (!state) {
        setPaused(true);
        return;
      }
      const track = state.track_window?.current_track;
      if (track) {
        const idx = tracksRef.current.findIndex((t) => t.uri === track.uri);
        if (idx >= 0) currentIndexRef.current = idx;
        applyMeta(
          track,
          tracksRef.current,
          playlistNameRef.current,
          playlistTotalRef.current,
          currentIndexRef.current,
        );
        syncTempoFromTrack(track);
      }
      setPositionMs(state.position ?? 0);
      setDurationMs(state.duration ?? 0);
      setPaused(Boolean(state.paused));
    },
    [applyMeta, syncTempoFromTrack],
  );

  const initPlayer = useCallback(async () => {
    if (playerRef.current) return playerRef.current;
    await loadSpotifySdk();
    const token = await getStoredToken();
    if (!token) throw new Error('Connect Spotify first');

    const player = new window.Spotify.Player({
      name: 'KAMmit Record Player',
      getOAuthToken: async (cb) => {
        const t = await getStoredToken();
        cb(t?.access_token);
      },
      volume: 0.8,
    });

    player.addListener('ready', ({ device_id }) => {
      deviceIdRef.current = device_id;
      setStatus('Record player ready ♥');
    });
    player.addListener('not_ready', () => {
      deviceIdRef.current = null;
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
    player.addListener('player_state_changed', updateFromState);

    const ok = await player.connect();
    if (!ok) {
      throw new Error('Could not connect player — try Log out → Connect again');
    }
    playerRef.current = player;
    return player;
  }, [updateFromState]);

  const ensurePlayer = useCallback(async () => {
    const token = await getStoredToken();
    if (!token) throw new Error('Connect Spotify first');
    if (!playerRef.current) {
      setStatus('Starting player…');
      await initPlayer();
    }
    return playerRef.current;
  }, [initPlayer]);

  useEffect(() => {
    setReady(true);
    getStoredToken().then(async (token) => {
      setLoggedIn(Boolean(token));
      if (token) {
        try {
          setStatus('Starting player…');
          await initPlayer();
        } catch (err) {
          setStatus(err.message || 'Player failed to start');
        }
      }
    });

    if (sessionStorage.getItem('kammit_open_player')) {
      sessionStorage.removeItem('kammit_open_player');
      setOpen(true);
    }

    const onOpen = () => setOpen(true);
    const onToggle = () => setOpen((v) => !v);
    const onClose = () => setOpen(false);
    const onMsg = (event) => {
      if (event.source !== window) return;
      const type = event.data?.type;
      if (type === 'KAMMIT_OPEN_PLAYER') setOpen(true);
      if (type === 'KAMMIT_TOGGLE_PLAYER') setOpen((v) => !v);
      if (type === 'KAMMIT_CLOSE_PLAYER') setOpen(false);
    };

    window.addEventListener('kammit:open-player', onOpen);
    window.addEventListener('kammit:toggle-player', onToggle);
    window.addEventListener('kammit:close-player', onClose);
    window.addEventListener('message', onMsg);

    const poll = setInterval(async () => {
      const player = playerRef.current;
      if (!player || pausedRef.current) return;
      const state = await player.getCurrentState();
      if (state) updateFromState(state);
    }, 1000);

    return () => {
      window.removeEventListener('kammit:open-player', onOpen);
      window.removeEventListener('kammit:toggle-player', onToggle);
      window.removeEventListener('kammit:close-player', onClose);
      window.removeEventListener('message', onMsg);
      clearInterval(poll);
      stopBeatLoop();
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, [initPlayer, stopBeatLoop, updateFromState]);

  useEffect(() => {
    if (open) window.postMessage({ type: 'KAMMIT_PLAYER_ACK' }, '*');
  }, [open]);

  async function waitForDevice(timeoutMs = 4000) {
    const start = Date.now();
    while (!deviceIdRef.current && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (!deviceIdRef.current) {
      throw new Error('Player device not ready — connect Spotify and wait for “ready ♥”');
    }
    return deviceIdRef.current;
  }

  async function loadContext() {
    const parsed = parseSpotifyUrl(url);
    if (!parsed) {
      setStatus('Paste a Spotify playlist or album URL');
      return;
    }

    const { type, id } = parsed;
    contextUriRef.current = `spotify:${type}:${id}`;
    tracksRef.current = [];
    currentIndexRef.current = 0;
    playlistTotalRef.current = null;
    playlistNameRef.current = '';
    setStatus(type === 'album' ? 'Loading album…' : 'Loading playlist…');

    if (type === 'album') {
      try {
        const album = await spotifyFetch(`/albums/${id}?market=from_token`);
        playlistNameRef.current = album.name || '';
        playlistTotalRef.current = album.total_tracks ?? album.tracks?.total ?? null;
        const albumArtists = album.artists || [];
        tracksRef.current = (album.tracks?.items || [])
          .filter((t) => t && t.uri && !t.is_local)
          .map((t) => ({
            ...t,
            artists: t.artists?.length ? t.artists : albumArtists,
            album: { name: playlistNameRef.current, images: album.images },
          }));
      } catch {
        tracksRef.current = [];
      }
    } else {
      try {
        const playlist = await spotifyFetch(`/playlists/${id}`);
        playlistNameRef.current = playlist.name || '';
        playlistTotalRef.current =
          playlist.items?.total ?? playlist.tracks?.total ?? null;
      } catch {
        // context play still works
      }
      try {
        const data = await spotifyFetch(
          `/playlists/${id}/items?limit=50&market=from_token`,
        );
        tracksRef.current = (data.items || [])
          .map((row) => row.item || row.track)
          .filter((t) => t && t.type === 'track' && t.uri && !t.is_local);
      } catch (err) {
        if (err.status !== 403) throw err;
        tracksRef.current = [];
      }
    }

    localStorage.setItem(LAST_URL_KEY, url);
    const kindLabel = type === 'album' ? 'Album' : 'Playlist';

    if (tracksRef.current.length) {
      applyMeta(
        tracksRef.current[0],
        tracksRef.current,
        playlistNameRef.current,
        playlistTotalRef.current,
        0,
      );
      setPositionMs(0);
      setDurationMs(tracksRef.current[0].duration_ms || 0);
      setPaused(true);
      setStatus(`Loaded ${tracksRef.current.length} tracks — hit play`);
    } else {
      applyMeta(
        {
          name: playlistNameRef.current || `${kindLabel} ready`,
          artists: [{ name: 'Hit play to start' }],
          album: { name: '—' },
        },
        [],
        playlistNameRef.current,
        playlistTotalRef.current,
        0,
      );
      setPositionMs(0);
      setDurationMs(0);
      setPaused(true);
      setStatus(
        playlistTotalRef.current
          ? `Ready (${playlistTotalRef.current} songs). Hit ▶`
          : 'Ready — hit ▶',
      );
    }
  }

  async function playCurrent() {
    const player = await ensurePlayer();
    if (!contextUriRef.current && !tracksRef.current.length) {
      throw new Error('Load a playlist or album first');
    }
    const deviceId = await waitForDevice();

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
      // ignore
    }

    const body = contextUriRef.current
      ? {
          context_uri: contextUriRef.current,
          ...(tracksRef.current.length
            ? { offset: { position: currentIndexRef.current } }
            : {}),
        }
      : {
          uris: tracksRef.current.map((t) => t.uri),
          offset: { position: currentIndexRef.current },
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
    if (!contextUriRef.current && !tracksRef.current.length) {
      setStatus('Load a playlist or album first');
      return;
    }

    const player = playerRef.current;
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

  async function skip(dir) {
    const player = playerRef.current;
    if (!player || (!contextUriRef.current && !tracksRef.current.length)) return;
    const state = await player.getCurrentState();
    if (!state) {
      await playCurrent();
      return;
    }
    if (dir === 'next') await player.nextTrack();
    else await player.previousTrack();
  }

  function seekFromEvent(event) {
    const player = playerRef.current;
    if (!durationMs || !player || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const ms = Math.floor((x / rect.width) * durationMs);
    player.seek(ms);
    setPositionMs(ms);
  }

  async function onLogin() {
    try {
      setStatus(`Opening Spotify…\nRedirect URI must be:\n${getSpotifyRedirectUri()}`);
      await beginSpotifyLogin();
    } catch (err) {
      setStatus(err.message || 'Login failed');
    }
  }

  async function onLogout() {
    stopBeatLoop();
    playerRef.current?.disconnect();
    playerRef.current = null;
    deviceIdRef.current = null;
    logoutSpotify();
    setLoggedIn(false);
    setMeta(emptyMeta());
    setPositionMs(0);
    setDurationMs(0);
    setPaused(true);
    setStatus('Logged out');
  }

  const pct = durationMs > 0 ? Math.min(100, (positionMs / durationMs) * 100) : 0;

  return (
    <div
      className="rp-root"
      data-ready={ready ? 'true' : 'false'}
      data-open={open ? 'true' : 'false'}
      data-playing={playing ? 'true' : 'false'}
    >
      <button
        type="button"
        className="rp-fab"
        aria-label="Open playlist player"
        aria-expanded={open}
        title="Playlist player"
        onClick={() => setOpen(true)}
      >
        <span className="rp-fab-elvis-wrap">
          <ElvisCat mood={playing ? 'ecstatic' : 'chill'} size="tiny" className="rp-fab-elvis" />
        </span>
        <span className="rp-fab-vinyl" data-spinning={playing ? 'true' : 'false'} aria-hidden="true">
          <span className="rp-fab-label">KAM</span>
        </span>
        <span className="rp-fab-hearts" aria-hidden="true">
          {fabFx.map((f) => (
            <img
              key={f.id}
              className={`rp-fab-px ${f.kind}`}
              src={f.kind === 'heart' ? HEART_SRC : NOTE_SRC}
              alt=""
              draggable={false}
              style={{ '--x': f.x }}
            />
          ))}
        </span>
      </button>

      <div className="rp-panel" role="dialog" aria-label="KAMmit record player">
        <header className="rp-bar">
          <span>record_player.exe</span>
          <button
            type="button"
            className="rp-min"
            title="Minimize to vinyl"
            aria-label="Minimize"
            onClick={() => setOpen(false)}
          >
            –
          </button>
        </header>

        <div className="rp-body">
          <p className="rp-eyebrow">kammit.dev · elvis approved vinyl</p>

          <section className="rp-stage" aria-label="Record player">
            <div className="rp-fx" aria-hidden="true">
              {stageFx.map((f) => (
                <span
                  key={f.id}
                  className={`rp-pixel-fx ${f.kind}`}
                  style={{
                    left: f.left,
                    bottom: f.bottom,
                    '--drift': f.drift,
                  }}
                >
                  <img
                    src={f.kind === 'heart' ? HEART_SRC : NOTE_SRC}
                    alt=""
                    draggable={false}
                  />
                </span>
              ))}
            </div>

            <div
              ref={elvisWrapRef}
              className={`rp-elvis-wrap${elvisBeat ? ' beat' : ''}`}
              data-playing={playing ? 'true' : 'false'}
            >
              <ElvisCat
                mood={playing ? 'ecstatic' : 'content'}
                size="small"
                className="rp-elvis"
              />
              <span className="rp-elvis-shadow" aria-hidden="true" />
            </div>

            <div className="rp-deck">
              <div className="rp-platter" data-spinning={playing ? 'true' : 'false'}>
                <div className="rp-label">
                  <span className="rp-label-kam">KAM</span>
                </div>
              </div>
              <div className="rp-tonearm" data-down={playing ? 'true' : 'false'} aria-hidden="true">
                <span className="arm" />
                <span className="needle" />
              </div>
            </div>
          </section>

          <section className="rp-meta" aria-live="polite">
            <h1>{meta.name}</h1>
            <p>{meta.artist}</p>
            <p className="album">{meta.album}</p>
            <p className="index">{meta.index}</p>
          </section>

          <section>
            <div className="rp-times">
              <span>{formatMs(positionMs)}</span>
              <span>−{formatMs(Math.max(0, durationMs - positionMs))}</span>
              <span>{formatMs(durationMs)}</span>
            </div>
            <div
              ref={progressRef}
              className="rp-progress"
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct)}
              tabIndex={0}
              onClick={seekFromEvent}
            >
              <div className="rp-progress-fill" style={{ width: `${pct}%` }} />
              <button
                type="button"
                className="rp-heart-scrubber"
                style={{ left: `${pct}%` }}
                aria-label="Seek"
                onClick={(e) => {
                  e.stopPropagation();
                  seekFromEvent(e);
                }}
              >
                <img src={HEART_SRC} alt="" draggable={false} />
              </button>
            </div>
          </section>

          <section className="rp-controls">
            <button type="button" className="rp-btn" title="Previous" onClick={() => skip('prev').catch((e) => setStatus(e.message))}>
              ⏮
            </button>
            <button
              type="button"
              className="rp-btn rp-btn-main"
              title="Play/Pause"
              onClick={() => togglePlay()}
            >
              {paused ? '▶' : '❚❚'}
            </button>
            <button type="button" className="rp-btn" title="Next" onClick={() => skip('next').catch((e) => setStatus(e.message))}>
              ⏭
            </button>
          </section>

          <section className="rp-form">
            <label htmlFor="rp-playlist-url">Playlist or album URL</label>
            <div className="rp-row">
              <input
                id="rp-playlist-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/… or /album/…"
                autoComplete="off"
              />
              <button
                type="button"
                className="rp-btn"
                onClick={() => loadContext().catch((e) => setStatus(e.message || 'Load failed'))}
              >
                Load
              </button>
            </div>
            <p className="rp-status" role="status">
              {status}
            </p>
          </section>

          <section className="rp-auth">
            {!loggedIn ? (
              <button type="button" className="rp-btn rp-btn-accent" onClick={onLogin}>
                Connect Spotify
              </button>
            ) : (
              <button type="button" className="rp-btn ghost" onClick={onLogout}>
                Log out
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
