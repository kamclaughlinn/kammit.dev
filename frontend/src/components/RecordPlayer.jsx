import { useCallback, useEffect, useState } from 'react';
import ElvisCat from './ElvisCat';
import { getYoutubeEmbedUrl, YOUTUBE_PLAYLIST_ID } from '../spotify/embedConfig';
import './RecordPlayer.css';

const HEART_SRC = `${import.meta.env.BASE_URL}spotify/pixel-heart.png`;
const NOTE_SRC = `${import.meta.env.BASE_URL}spotify/pixel-note.png`;
const EMBED_SRC = getYoutubeEmbedUrl(YOUTUBE_PLAYLIST_ID);
const EMBED_READY =
  YOUTUBE_PLAYLIST_ID && !YOUTUBE_PLAYLIST_ID.startsWith('REPLACE_');

export default function RecordPlayer() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [stageFx, setStageFx] = useState([]);
  const [elvisBeat, setElvisBeat] = useState(false);
  const listening = open;

  const closePlayer = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setReady(true);
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

    return () => {
      window.removeEventListener('kammit:open-player', onOpen);
      window.removeEventListener('kammit:toggle-player', onToggle);
      window.removeEventListener('kammit:close-player', onClose);
      window.removeEventListener('message', onMsg);
    };
  }, []);

  useEffect(() => {
    if (open) window.postMessage({ type: 'KAMMIT_PLAYER_ACK' }, '*');
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const beat = () => {
      const kind = Math.random() > 0.45 ? 'heart' : 'note';
      const id = `${Date.now()}-${Math.random()}`;
      setStageFx((prev) => [
        ...prev.slice(-10),
        {
          id,
          kind,
          left: `${12 + Math.random() * 70}%`,
          bottom: `${20 + Math.random() * 40}%`,
          drift: `${Math.round((Math.random() - 0.5) * 28)}px`,
        },
      ]);
      setTimeout(() => setStageFx((prev) => prev.filter((f) => f.id !== id)), 1200);
      setElvisBeat(true);
      setTimeout(() => setElvisBeat(false), 180);
    };

    beat();
    const timer = setInterval(beat, 520);
    return () => clearInterval(timer);
  }, [open]);

  return (
    <div
      className="rp-root"
      data-ready={ready ? 'true' : 'false'}
      data-open={open ? 'true' : 'false'}
      data-playing={listening ? 'true' : 'false'}
    >
      {open ? (
        <button
          type="button"
          className="rp-backdrop"
          aria-label="Close record player"
          onClick={closePlayer}
        />
      ) : null}

      <button
        type="button"
        className="rp-fab"
        aria-label="Open playlist player"
        aria-expanded={open}
        title="Playlist player"
        onClick={() => setOpen(true)}
      >
        <span className="rp-fab-elvis-wrap">
          <ElvisCat mood={listening ? 'ecstatic' : 'chill'} size="tiny" className="rp-fab-elvis" />
        </span>
        <span
          className="rp-fab-vinyl"
          data-spinning={listening ? 'true' : 'false'}
          aria-hidden="true"
        >
          <span className="rp-fab-label">KAM</span>
        </span>
      </button>

      <div
        className="rp-panel"
        role="dialog"
        aria-modal={open}
        aria-hidden={!open}
        aria-label="KAMmit record player"
        ref={(el) => {
          if (el) el.inert = !open;
        }}
      >
        <header className="rp-bar">
          <span>record_player.exe</span>
          <div className="rp-bar-actions">
            <button
              type="button"
              className="rp-min"
              title="Minimize to vinyl"
              aria-label="Minimize to vinyl"
              onClick={closePlayer}
            >
              –
            </button>
            <button
              type="button"
              className="rp-close"
              title="Close"
              aria-label="Close player"
              onClick={closePlayer}
            >
              ×
            </button>
          </div>
        </header>

        <div className="rp-body rp-body-embed">
          <div className="rp-embed-wrap">
            {EMBED_READY ? (
              <iframe
                title="KAMmit YouTube playlist"
                src={EMBED_SRC}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
                allowFullScreen
              />
            ) : (
              <div className="rp-embed-missing">
                <p>Add your YouTube playlist ID in</p>
                <code>frontend/src/spotify/embedConfig.js</code>
                <p className="rp-embed-missing-sub">
                  From a URL like youtube.com/playlist?list=<strong>PLxxxx</strong>
                </p>
              </div>
            )}
          </div>

          <footer className="rp-footer-stage" aria-label="Elvis and vinyl">
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
              className={`rp-elvis-wrap${elvisBeat ? ' beat' : ''}`}
              data-playing={listening ? 'true' : 'false'}
            >
              <ElvisCat
                mood={listening ? 'ecstatic' : 'content'}
                size="small"
                className="rp-elvis"
              />
            </div>

            <div className="rp-deck">
              <div className="rp-platter" data-spinning={listening ? 'true' : 'false'}>
                <div className="rp-label">
                  <span className="rp-label-kam">KAM</span>
                </div>
              </div>
              <div
                className="rp-tonearm"
                data-down={listening ? 'true' : 'false'}
                aria-hidden="true"
              >
                <span className="arm" />
                <span className="needle" />
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
