import { useState, useEffect, useCallback } from 'react';
import { elvisApi } from '../api/elvisApi';
import PixelWindow from './ui/PixelWindow';
import PixelSprite from './ui/PixelSprite';
import ElvisCat from './ElvisCat';
import { MountainScene } from './ui/PixelScene';
import { getHeartSprite } from '../sprites/pixelHeart';
import './ElvisDigipet.css';

const heartSprite = getHeartSprite();

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
  const [teachMsg, setTeachMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState('');
  const [hearts, setHearts] = useState([]);
  const [heartCount, setHeartCount] = useState(0);
  const [connecting, setConnecting] = useState(true);
  const [offline, setOffline] = useState(false);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setConnecting(true);
    try {
      const [elvisState, knownPhrases] = await Promise.all([
        elvisApi.getState(),
        elvisApi.getPhrases(),
      ]);
      setState(elvisState);
      setPhrases(knownPhrases);
      setOffline(false);
    } catch {
      setOffline(true);
      setState((prev) => prev ?? {
        hunger: 50, happiness: 50, cleanliness: 50, energy: 50,
        mood: 'chill', message: 'Elvis is napping... (server waking up?)',
      });
    } finally {
      setConnecting(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(() => refresh({ silent: true }), offline ? 5000 : 15000);
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
    setHeartCount((c) => c + 1);
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
    if (!newPhrase.trim()) return;
    setLoading(true);
    setTeachMsg('');
    try {
      const result = await elvisApi.teach(newPhrase);
      setTeachMsg(result.message);
      if (result.success) {
        setNewPhrase('');
        const knownPhrases = await elvisApi.getPhrases();
        setPhrases(knownPhrases);
      }
    } catch {
      setTeachMsg('Something went wrong teaching Elvis.');
    } finally {
      setLoading(false);
    }
  }

  const mood = state?.mood || 'chill';

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
                <p className="elvis-speech-bubble waking">
                  Waking Elvis up… free-tier server, can take up to a minute.
                </p>
              )}

              {offline && !connecting && (
                <div className="elvis-offline-row">
                  <p className="elvis-speech-bubble offline">
                    Server&apos;s asleep — auto-retrying every 5s, or hit Wake Elvis.
                  </p>
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
                <p className="elvis-speech-bubble" key={state.message}>
                  {state.message}
                </p>
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
              {heartCount > 0 && (
                <span className="heart-count">{heartCount} ♥ given</span>
              )}
            </div>
          </PixelWindow>

          <PixelWindow title="Teach Elvis.exe" compact className="elvis-teach-window">
            <p className="teach-hint">
              Leave a short phrase for Elvis to learn. Content is filtered.
            </p>
            <form onSubmit={handleTeach} className="teach-form">
              <input
                type="text"
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                placeholder="e.g. treats are life"
                maxLength={120}
                disabled={loading}
              />
              <button type="submit" className="btn btn-accent" disabled={loading || !newPhrase.trim()}>
                Teach!
              </button>
            </form>
            {teachMsg && (
              <p className={`teach-msg ${teachMsg.includes('learned') ? 'success' : 'error'}`}>
                {teachMsg}
              </p>
            )}

            <div className="known-phrases">
              <h4>Elvis's vocabulary ({phrases.length})</h4>
              {phrases.length === 0 ? (
                <p className="no-phrases">No phrases yet — be the first to teach him!</p>
              ) : (
                <ul>
                  {phrases.map((phrase) => (
                    <li key={phrase}>&gt; "{phrase}"</li>
                  ))}
                </ul>
              )}
            </div>
          </PixelWindow>
        </div>
      </div>
    </MountainScene>
  );
}
