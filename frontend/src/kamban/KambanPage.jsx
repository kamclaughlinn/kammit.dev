import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SkyScene } from '../components/ui/PixelScene';
import XpWindow from '../components/ui/XpWindow';
import ElvisCat from '../components/ElvisCat';
import TouchCrosshair from '../components/TouchCrosshair';
import { kambanApi } from '../api/kambanApi';
import StickyCard from './StickyCard';
import './KambanPage.css';

const BOARD_KEY = 'kamban-board-id';

const EXE_TITLES = ['todo.exe', 'doing.exe', 'done.exe'];

const ELVIS_LINES = {
  hello: 'welcome to the shrine',
  add: 'new quest unlocked',
  move: 'move it already',
  doing: 'get to work',
  done: "proud of u ♥",
  delete: 'bye bye task',
  error: 'backend nap time…',
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
    let cancelled = false;

    async function boot() {
      setLoading(true);
      setError(null);
      try {
        const stored = localStorage.getItem(BOARD_KEY);
        if (stored) {
          try {
            const existing = await kambanApi.getBoard(stored);
            if (!cancelled) {
              setBoard(existing);
              say(ELVIS_LINES.hello);
            }
            return;
          } catch {
            localStorage.removeItem(BOARD_KEY);
          }
        }

        const created = await kambanApi.createBoard({ name: 'KAMban' });
        localStorage.setItem(BOARD_KEY, String(created.id));
        if (!cancelled) {
          setBoard(created);
          say(ELVIS_LINES.hello);
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

  async function handleAddCard(columnId) {
    const title = (drafts[columnId] || '').trim();
    if (!title) return;

    try {
      await kambanApi.createCard(columnId, { title });
      setDrafts((prev) => ({ ...prev, [columnId]: '' }));
      await refreshBoard();
      say(ELVIS_LINES.add);
    } catch {
      say(ELVIS_LINES.error);
    }
  }

  async function handleDelete(cardId) {
    try {
      await kambanApi.deleteCard(cardId);
      await refreshBoard();
      say(ELVIS_LINES.delete);
    } catch {
      say(ELVIS_LINES.error);
    }
  }

  async function handleMove(cardId, columnId, position) {
    try {
      await kambanApi.moveCard(cardId, columnId, position);
      setLandingId(cardId);
      await refreshBoard();
      const colIndex = columns.findIndex((c) => c.id === columnId);
      if (colIndex === 2) say(ELVIS_LINES.done);
      else if (colIndex === 1) say(ELVIS_LINES.doing);
      else say(ELVIS_LINES.move);
      window.setTimeout(() => setLandingId(null), 400);
    } catch {
      say(ELVIS_LINES.error);
    }
  }

  function onDragStart(e, card) {
    setDragCardId(card.id);
    e.dataTransfer.setData('text/plain', String(card.id));
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragEnd() {
    setDragCardId(null);
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  async function onDrop(e, column) {
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
      </header>

      <main className="kamban-main container">
        {loading && <p className="kamban-status">booting board…</p>}
        {error && (
          <p className="kamban-status kamban-error">
            {error} — is the backend awake?
          </p>
        )}

        {!loading && !error && (
          <div className="kamban-board">
            {columns.map((column, index) => (
              <XpWindow
                key={column.id}
                title={EXE_TITLES[index] || `col_${index}.exe`}
                className="kamban-column-window"
              >
                <p className="kamban-column-label">{column.title}</p>

                <div
                  className={`kamban-card-list ${dragCardId ? 'is-droppable' : ''}`}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, column)}
                >
                  {sortByPosition(column.cards).map((card) => (
                    <StickyCard
                      key={card.id}
                      card={card}
                      landing={landingId === card.id}
                      onDelete={handleDelete}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                  {(column.cards?.length || 0) === 0 && (
                    <p className="kamban-empty">drop sticky notes here</p>
                  )}
                </div>

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
