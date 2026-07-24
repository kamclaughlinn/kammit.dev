import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SkyScene } from '../components/ui/PixelScene';
import XpWindow from '../components/ui/XpWindow';
import ElvisCat from '../components/ElvisCat';
import TouchCrosshair from '../components/TouchCrosshair';
import { kambanApi } from '../api/kambanApi';
import { elvisApi } from '../api/elvisApi';
import StickyCard from './StickyCard';
import './KambanPage.css';

const BOARD_KEY = 'kamban-board-id';
const ADMIN_KEY_STORAGE = 'elvis-admin-key';

const EXE_TITLES = ['todo.exe', 'doing.exe', 'done.exe'];

const ELVIS_LINES = {
  hello: 'welcome to the shrine',
  add: 'new quest unlocked',
  move: 'move it already',
  doing: 'get to work',
  done: "proud of u ♥",
  delete: 'bye bye task',
  locked: 'view only — unlock admin to edit',
  unlocked: 'admin mode — go wild (responsibly)',
  error: 'backend nap time…',
  denied: 'nope. admin only.',
};

function sortByPosition(items = []) {
  return [...items].sort((a, b) => a.position - b.position);
}

export default function KambanPage() {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [elvisLine, setElvisLine] = useState(ELVIS_LINES.hello);
  const [bubbleKey, setBubbleKey] = useState(0);
  const [landingId, setLandingId] = useState(null);
  const [dragCardId, setDragCardId] = useState(null);
  const [adminKey, setAdminKey] = useState('');
  const [adminDraft, setAdminDraft] = useState('');
  const [showAdminUnlock, setShowAdminUnlock] = useState(false);
  const [adminMsg, setAdminMsg] = useState('');

  const isAdmin = Boolean(adminKey);

  const columns = useMemo(
    () => sortByPosition(board?.columns || []),
    [board],
  );

  function say(line) {
    setElvisLine(line);
    setBubbleKey((k) => k + 1);
  }

  async function refreshBoard(id = board?.id) {
    if (!id) return;
    const next = await kambanApi.getBoard(id);
    setBoard(next);
    return next;
  }

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (!stored) return undefined;
    let cancelled = false;
    (async () => {
      try {
        await elvisApi.verifyAdmin(stored);
        if (!cancelled) {
          setAdminKey(stored);
          say(ELVIS_LINES.unlocked);
        }
      } catch {
        sessionStorage.removeItem(ADMIN_KEY_STORAGE);
        if (!cancelled) setAdminKey('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get('board');
        const stored = fromUrl || localStorage.getItem(BOARD_KEY);

        if (stored) {
          try {
            const existing = await kambanApi.getBoard(stored);
            localStorage.setItem(BOARD_KEY, String(existing.id));
            if (!cancelled) {
              setBoard(existing);
              say(ELVIS_LINES.hello);
            }
            return;
          } catch {
            if (!fromUrl) localStorage.removeItem(BOARD_KEY);
          }
        }

        // Creating a board requires admin — visitors just see an empty unlock prompt.
        if (!cancelled) {
          setError('No board yet. Unlock admin to create KAMban.');
          say(ELVIS_LINES.locked);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load board');
          say(ELVIS_LINES.error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  async function ensureBoard(key = adminKey) {
    if (board?.id) return board;
    const created = await kambanApi.createBoard({ name: 'KAMban' }, key);
    localStorage.setItem(BOARD_KEY, String(created.id));
    setBoard(created);
    setError(null);
    return created;
  }

  async function handleAdminUnlock(e) {
    e.preventDefault();
    const key = adminDraft.trim();
    if (!key) return;
    setAdminMsg('');
    try {
      await elvisApi.verifyAdmin(key);
      sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
      setAdminKey(key);
      setAdminDraft('');
      setShowAdminUnlock(false);
      setAdminMsg('Admin mode on.');
      say(ELVIS_LINES.unlocked);
      if (!board) {
        await ensureBoard(key);
      }
    } catch (err) {
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
      setAdminKey('');
      setAdminMsg(err?.status === 503
        ? 'Admin key not set on server.'
        : 'Wrong key. Nice try.');
      say(ELVIS_LINES.denied);
    }
  }

  function handleAdminLock() {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setAdminKey('');
    setAdminMsg('Admin locked again.');
    say(ELVIS_LINES.locked);
  }

  async function handleAddCard(columnId) {
    if (!isAdmin) {
      say(ELVIS_LINES.denied);
      return;
    }
    const title = (drafts[columnId] || '').trim();
    if (!title) return;

    try {
      await kambanApi.createCard(columnId, { title }, adminKey);
      setDrafts((prev) => ({ ...prev, [columnId]: '' }));
      await refreshBoard();
      say(ELVIS_LINES.add);
    } catch {
      say(ELVIS_LINES.denied);
    }
  }

  async function handleDelete(cardId) {
    if (!isAdmin) {
      say(ELVIS_LINES.denied);
      return;
    }
    try {
      await kambanApi.deleteCard(cardId, adminKey);
      await refreshBoard();
      say(ELVIS_LINES.delete);
    } catch {
      say(ELVIS_LINES.denied);
    }
  }

  async function handleMove(cardId, columnId, position) {
    if (!isAdmin) {
      say(ELVIS_LINES.denied);
      return;
    }
    try {
      await kambanApi.moveCard(cardId, columnId, position, adminKey);
      setLandingId(cardId);
      await refreshBoard();
      const colIndex = columns.findIndex((c) => c.id === columnId);
      if (colIndex === 2) say(ELVIS_LINES.done);
      else if (colIndex === 1) say(ELVIS_LINES.doing);
      else say(ELVIS_LINES.move);
      window.setTimeout(() => setLandingId(null), 400);
    } catch {
      say(ELVIS_LINES.denied);
    }
  }

  function onDragStart(e, card) {
    if (!isAdmin) return;
    setDragCardId(card.id);
    e.dataTransfer.setData('text/plain', String(card.id));
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragEnd() {
    setDragCardId(null);
  }

  function onDragOver(e) {
    if (!isAdmin) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  async function onDrop(e, column) {
    if (!isAdmin) return;
    e.preventDefault();
    const cardId = Number(e.dataTransfer.getData('text/plain') || dragCardId);
    if (!cardId) return;
    const position = column.cards?.length || 0;
    await handleMove(cardId, column.id, position);
    setDragCardId(null);
  }

  return (
    <SkyScene className="kamban-page">
      <TouchCrosshair />

      <header className="kamban-header container">
        <Link to="/" className="kamban-back">← kammit.dev</Link>
        <h1 className="kamban-brand">KAMban</h1>
        <p className="kamban-tagline">kanban, but make it kam · rip windows xp</p>

        <div className="kamban-admin-bar">
          {isAdmin ? (
            <button type="button" className="kamban-admin-toggle" onClick={handleAdminLock}>
              lock admin
            </button>
          ) : (
            <button
              type="button"
              className="kamban-admin-toggle"
              onClick={() => setShowAdminUnlock((v) => !v)}
            >
              admin
            </button>
          )}
          {showAdminUnlock && !isAdmin && (
            <form className="kamban-admin-unlock" onSubmit={handleAdminUnlock}>
              <input
                type="password"
                value={adminDraft}
                onChange={(e) => setAdminDraft(e.target.value)}
                placeholder="admin key"
                autoComplete="off"
              />
              <button type="submit">Unlock</button>
            </form>
          )}
          {adminMsg && <p className="kamban-admin-msg">{adminMsg}</p>}
          {!isAdmin && board && (
            <p className="kamban-view-only">view only — stickies locked</p>
          )}
        </div>
      </header>

      <main className="kamban-main container">
        {loading && <p className="kamban-status">booting board…</p>}
        {error && !board && (
          <p className="kamban-status kamban-error">
            {error}
          </p>
        )}

        {board && (
          <div className="kamban-board">
            {columns.map((column, index) => (
              <XpWindow
                key={column.id}
                title={EXE_TITLES[index] || `col_${index}.exe`}
                className="kamban-column-window"
              >
                <p className="kamban-column-label">{column.title}</p>

                <div
                  className={`kamban-card-list ${isAdmin && dragCardId ? 'is-droppable' : ''}`}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, column)}
                >
                  {sortByPosition(column.cards).map((card) => (
                    <StickyCard
                      key={card.id}
                      card={card}
                      editable={isAdmin}
                      landing={landingId === card.id}
                      onDelete={handleDelete}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                  {(column.cards?.length || 0) === 0 && (
                    <p className="kamban-empty">
                      {isAdmin ? 'drop sticky notes here' : 'nothing here yet'}
                    </p>
                  )}
                </div>

                {isAdmin ? (
                  <form
                    className="kamban-add"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddCard(column.id);
                    }}
                  >
                    <input
                      type="text"
                      value={drafts[column.id] || ''}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [column.id]: e.target.value,
                        }))
                      }
                      placeholder="new sticky…"
                      maxLength={120}
                    />
                    <button type="submit">+</button>
                  </form>
                ) : null}
              </XpWindow>
            ))}
          </div>
        )}
      </main>

      <aside className="kamban-elvis" aria-live="polite">
        <div key={bubbleKey} className="kamban-elvis-bubble">
          {elvisLine}
        </div>
        <ElvisCat mood="content" size="small" className="kamban-elvis-sprite" />
      </aside>
    </SkyScene>
  );
}
