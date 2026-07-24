import './StickyCard.css';

const STICKY_COLORS = ['sticky-cream', 'sticky-yellow', 'sticky-pink', 'sticky-mint'];

export default function StickyCard({
  card,
  onDelete,
  onDragStart,
  onDragEnd,
  landing = false,
  editable = false,
}) {
  const colorClass = STICKY_COLORS[card.id % STICKY_COLORS.length];

  return (
    <article
      className={`sticky-card ${colorClass} ${landing ? 'is-landing' : ''} ${editable ? '' : 'is-locked'}`}
      draggable={editable}
      onDragStart={editable ? (e) => onDragStart?.(e, card) : undefined}
      onDragEnd={editable ? onDragEnd : undefined}
    >
      <div className="sticky-tape" aria-hidden="true" />
      <h3 className="sticky-title">{card.title}</h3>
      {card.description ? (
        <p className="sticky-desc">{card.description}</p>
      ) : null}
      {editable ? (
        <button
          type="button"
          className="sticky-delete"
          onClick={() => onDelete?.(card.id)}
          aria-label={`Delete ${card.title}`}
        >
          ×
        </button>
      ) : null}
    </article>
  );
}
