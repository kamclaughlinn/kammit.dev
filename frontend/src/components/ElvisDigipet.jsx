import { useState, useEffect, useCallback } from 'react';
import { elvisApi } from '../api/elvisApi';
import PixelWindow from './ui/PixelWindow';
import PixelSprite from './ui/PixelSprite';
import ElvisCat from './ElvisCat';
import { MountainScene } from './ui/PixelScene';
import { getHeartSprite } from '../sprites/pixelHeart';
import './ElvisDigipet.css';

const heartSprite = getHeartSprite();
const ADMIN_KEY_STORAGE = 'elvis-admin-key';

const STAT_CONFIG = [
  { key: 'hunger', label: 'Hunger', invert: true },
  { key: 'happiness', label: 'Happiness' },
  { key: 'cleanliness', label: 'Cleanliness' },
  { key: 'energy', label: 'Energy' },
];

export default function ElvisDigipet() {
  const [state, setState] = useState(null);
  const [phrases, setPhrases] = useState([]);
  const [newPhrase, setNewPhrase] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [teachMsg, setTeachMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState('');
  const [hearts, setHearts] = useState([]);
  const [connecting, setConnecting] = useState(true);
  const [offline, setOffline] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [adminDraft, setAdminDraft] = useState('');
  const [showAdminUnlock, setShowAdminUnlock] = useState(false);
  const [adminMsg, setAdminMsg] = useState('');

  const isAdmin = Boolean(adminKey);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setConnecting(true);
    try {
      const [elvisState, knownPhrases] = await Promise.all([
        elvisApi.getState(),
        elvisApi.getPhrases(),
      ]);
      setState((prev) => (
        silent && prev
          ? { ...elvisState, message: prev.message }
          : elvisState
      ));
      setPhrases(Array.isArray(knownPhrases) ? knownPhrases : []);
      setOffline(false);
    } catch {
      setOffline(true);
      setState((prev) => prev ?? {
        hunger: 50, happiness: 50, cleanliness: 50, energy: 50,
        mood: 'chill', message: 'Elvis is napping... (server waking up?)',
        totalHearts: 0,
      });
    } finally {
      setConnecting(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (!stored) return undefined;
    let cancelled = false;
    (async () => {
      try {
        await elvisApi.verifyAdmin(stored);
        if (!cancelled) setAdminKey(stored);
      } catch {
        sessionStorage.removeItem(ADMIN_KEY_STORAGE);
        if (!cancelled) {
          setAdminKey('');
          setAdminMsg('Admin session expired — unlock again.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const ms = offline ? 5000 : 30000;
    const interval = setInterval(() => refresh({ silent: true }), ms);
    return () => clearInterval(interval);
  }, [refresh, offline]);

  async function doAction(action, anim) {
    if (loading) return;
    setLoading(true);
    setAnimating(anim);
    try {
      const result = await elvisApi[action]();
      setState(result);
    } catch {
      setState((s) => ({ ...s, message: 'Elvis ignored you. Try again!' }));
    } finally {
      setLoading(false);
      setTimeout(() => setAnimating(''), 600);
    }
  }

  async function handleHeart() {
    if (loading) return;
    const id = Date.now();
    setHearts((prev) => [...prev, id]);
    setTimeout(() => setHearts((prev) => prev.filter((h) => h !== id)), 900);

    setLoading(true);
    setAnimating('loved');
    try {
      const result = await elvisApi.heart();
      setState(result);
    } catch {
      setState((s) => ({
        ...s,
        happiness: Math.min(100, (s?.happiness ?? 50) + 10),
        message: 'Elvis purrs at the love~ ♥',
      }));
    } finally {
      setLoading(false);
      setTimeout(() => setAnimating(''), 600);
    }
  }

  async function handleTeach(e) {
    e.preventDefault();
    if (!newPhrase.trim() || !authorName.trim()) return;
    setLoading(true);
    setTeachMsg('');
    try {
      const result = await elvisApi.teach(newPhrase, authorName);
      setTeachMsg(result.message);
      if (result.success) {
        setNewPhrase('');
        const knownPhrases = await elvisApi.getPhrases();
        setPhrases(Array.isArray(knownPhrases) ? knownPhrases : []);
      }
    } catch {
      setTeachMsg('Something went wrong teaching Elvis.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePhrase(id) {
    if (!adminKey) return;
    setLoading(true);
    setAdminMsg('');
    try {
      await elvisApi.deletePhrase(id, adminKey);
      setPhrases((prev) => prev.filter((p) => p.id !== id));
      setAdminMsg('Phrase yeeted.');
    } catch {
      setAdminMsg('Delete failed — wrong key or server nap?');
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
      setAdminKey('');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminUnlock(e) {
    e.preventDefault();
    const key = adminDraft.trim();
    if (!key) return;
    setAdminMsg('');
    setLoading(true);
    try {
      await elvisApi.verifyAdmin(key);
      sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
      setAdminKey(key);
      setAdminDraft('');
      setShowAdminUnlock(false);
      setAdminMsg('Admin mode on. Delete buttons unlocked.');
    } catch (err) {
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
      setAdminKey('');
      const status = err?.status;
      if (status === 503) {
        setAdminMsg('Admin key not set on server (ELVIS_ADMIN_KEY).');
      } else {
        setAdminMsg('Wrong key. Nice try.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleAdminLock() {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setAdminKey('');
    setAdminMsg('Admin locked again.');
  }

  const mood = state?.mood || 'chill';
  const totalHearts = state?.totalHearts ?? 0;
  const displayedHearts = Math.min(totalHearts, 48);

  return (
    <MountainScene className="elvis-section section-zone" id="elvis">
      <div className="container">
        <h2 className="section-title">Elvis Digipet.exe</h2>
        <p className="section-subtitle">
          Feed, pet, play &amp; clean my ginger apprentice. Least you can do while you're here.
        </p>

        <div className="elvis-layout">
          <PixelWindow title="Elvis.exe" className="elvis-pet-window">
            <div className={`elvis-stage ${animating}`}>
              <div className="elvis-cat-display">
                <ElvisCat mood={mood} className="elvis-pixel-cat" size="large" />
                <span className="elvis-name-tag">Elvis</span>

                {hearts.map((id) => (
                  <span key={id} className="floating-heart" aria-hidden="true">♥</span>
                ))}
              </div>

              {connecting && !state && (
                <div className="elvis-speech-bubble waking">
                  Waking Elvis up… free-tier server, can take up to a minute.
                </div>
              )}

              {offline && !connecting && (
                <div className="elvis-offline-row">
                  <div className="elvis-speech-bubble offline">
                    Server&apos;s asleep — auto-retrying every 5s, or hit Wake Elvis.
                  </div>
                  <button
                    type="button"
                    className="btn btn-accent elvis-retry-btn"
                    disabled={connecting}
                    onClick={() => refresh()}
                  >
                    Wake Elvis
                  </button>
                </div>
              )}

              {!offline && state?.message && (
                <div className="elvis-speech-bubble" key={state.message}>
                  {state.message}
                </div>
              )}

              {!offline && !connecting && state && (
                <p className="elvis-connected-tag">Connected to Elvis HQ</p>
              )}
            </div>

            <div className="elvis-stats">
              {STAT_CONFIG.map(({ key, label, invert }) => {
                const value = state?.[key] ?? 50;
                const display = invert ? 100 - value : value;
                const color = display > 60 ? 'good' : display > 30 ? 'ok' : 'low';
                return (
                  <div key={key} className="stat-row">
                    <span className="stat-label">{label}</span>
                    <div className="progress-bar">
                      <div className={`progress-fill ${color}`} style={{ width: `${display}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="elvis-actions">
              <button className="btn action-btn" disabled={loading} onClick={() => doAction('feed', 'eating')}>
                Feed
              </button>
              <button className="btn action-btn" disabled={loading} onClick={() => doAction('pet', 'purring')}>
                Pet
              </button>
              <button className="btn action-btn" disabled={loading} onClick={() => doAction('play', 'playing')}>
                Play
              </button>
              <button className="btn action-btn" disabled={loading} onClick={() => doAction('clean', 'cleaning')}>
                Clean
              </button>
            </div>

            <div className="heart-react-row">
              <button
                className="btn btn-heart"
                disabled={loading}
                onClick={handleHeart}
                aria-label="Send love to Elvis"
              >
                <PixelSprite sprite={heartSprite} className="heart-icon" title="" />
                Love
              </button>
              {totalHearts > 0 && (
                <span className="heart-count">{totalHearts} ♥ given by visitors</span>
              )}
            </div>

            {totalHearts > 0 && (
              <div className="elvis-heart-garden" aria-label={`${totalHearts} hearts given to Elvis`}>
                {Array.from({ length: displayedHearts }, (_, i) => (
                  <span key={i} className="garden-heart" aria-hidden="true">♥</span>
                ))}
                {totalHearts > displayedHearts && (
                  <span className="garden-heart-more">+{totalHearts - displayedHearts} more</span>
                )}
              </div>
            )}
          </PixelWindow>

          <PixelWindow title="Teach Elvis.exe" compact className="elvis-teach-window">
            <p className="teach-hint">
              Leave a short phrase for Elvis to learn. Sign it so we know who taught him.
            </p>
            <form onSubmit={handleTeach} className="teach-form">
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="your name"
                maxLength={40}
                disabled={loading}
                aria-label="Your name"
              />
              <input
                type="text"
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                placeholder="e.g. treats are life"
                maxLength={120}
                disabled={loading}
                aria-label="Phrase to teach"
              />
              <button
                type="submit"
                className="btn btn-accent"
                disabled={loading || !newPhrase.trim() || !authorName.trim()}
              >
                Teach!
              </button>
            </form>
            {teachMsg && (
              <p className={`teach-msg ${teachMsg.includes('learned') ? 'success' : 'error'}`}>
                {teachMsg}
              </p>
            )}

            <div className="known-phrases">
              <div className="known-phrases-header">
                <h4>Elvis&apos;s vocabulary ({phrases.length})</h4>
                {isAdmin ? (
                  <button type="button" className="admin-toggle" onClick={handleAdminLock}>
                    lock admin
                  </button>
                ) : (
                  <button
                    type="button"
                    className="admin-toggle"
                    onClick={() => setShowAdminUnlock((v) => !v)}
                  >
                    admin
                  </button>
                )}
              </div>

              {showAdminUnlock && !isAdmin && (
                <form className="admin-unlock" onSubmit={handleAdminUnlock}>
                  <input
                    type="password"
                    value={adminDraft}
                    onChange={(e) => setAdminDraft(e.target.value)}
                    placeholder="admin key"
                    autoComplete="off"
                  />
                  <button type="submit" className="btn btn-accent">Unlock</button>
                </form>
              )}

              {adminMsg && <p className="admin-msg">{adminMsg}</p>}

              {phrases.length === 0 ? (
                <p className="no-phrases">No phrases yet — be the first to teach him!</p>
              ) : (
                <ul>
                  {phrases.map((phrase) => {
                    const text = typeof phrase === 'string' ? phrase : phrase.text;
                    const author = typeof phrase === 'string'
                      ? null
                      : (phrase.authorName || phrase.author_name || null);
                    const id = typeof phrase === 'string' ? text : phrase.id;
                    return (
                      <li key={id}>
                        <div className="phrase-main">
                          <span className="phrase-text">&gt; &quot;{text}&quot;</span>
                          {author ? (
                            <span className="phrase-author">— {author}</span>
                          ) : null}
                        </div>
                        {isAdmin && typeof phrase !== 'string' && phrase.id != null && (
                          <button
                            type="button"
                            className="phrase-delete"
                            onClick={() => handleDeletePhrase(phrase.id)}
                            disabled={loading}
                            aria-label={`Delete phrase ${text}`}
                          >
                            ×
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </PixelWindow>
        </div>
      </div>
    </MountainScene>
  );
}
