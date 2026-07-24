import './ElvisCat.css';

const ELVIS_SRC = `${import.meta.env.BASE_URL}elvis-cat.png`;

export default function ElvisCat({ mood = 'chill', className = '', size = 'large' }) {
  return (
    <img
      src={ELVIS_SRC}
      alt={`Elvis the cat — mood: ${mood}`}
      className={`elvis-cat-img elvis-cat-${size} mood-${mood} ${className}`}
      draggable={false}
    />
  );
}
