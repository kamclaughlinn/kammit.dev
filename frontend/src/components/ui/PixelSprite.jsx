import './PixelSprite.css';

export default function PixelSprite({ sprite, className = '', title = '' }) {
  if (!sprite) return null;
  const { pixels, width, height, scale } = sprite;
  const w = width * scale;
  const h = height * scale;

  return (
    <svg
      className={`pixel-sprite ${className}`}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {pixels.map(({ x, y, color }, i) => (
        <rect
          key={i}
          x={x * scale}
          y={y * scale}
          width={scale}
          height={scale}
          fill={color}
        />
      ))}
    </svg>
  );
}
