import './StickyCard.css';

const STICKY_COLORS = ['sticky-cream', 'sticky-yellow', 'sticky-pink', 'sticky-mint'];

export default function StickyCard({
  card,
  onDelete,
  onDragStart,
  onDragEnd,
  landing = false,
}) {
  const colorClass = STICKY_COLORS[card.id % STICKY_COLORS.length];

  return (
    <article
      className={`sticky-card ${colorClass} ${landing ? 'is-landing' : ''}`}
      draggable
      onDragStart={(e) => onDragStart?.(e, card)}
      onDragEnd={onDragEnd}
    >
      <div className="sticky-tape" aria-hidden="true" />
      <h3 className="sticky-title">{card.title}</h3>
      {card.description ? (
        <p className="sticky-desc">{card.description}</p>
      ) : null}
      <button
        type="button"
        className="sticky-delete"
        onClick={() => onDelete?.(card.id)}
        aria-label={`Delete ${card.title}`}
      >
        ×
      </button>
    </article>
  );
}
