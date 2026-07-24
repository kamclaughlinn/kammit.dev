import { useState } from 'react';
import PixelSprite from './ui/PixelSprite';
import { getDigitalMeSprite } from '../sprites/digitalMe';
import './DigitalMeFlip.css';

const backSprite = getDigitalMeSprite();

export default function DigitalMeFlip() {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      className={`digital-me-flip ${flipped ? 'is-flipped' : ''}`}
      onClick={() => setFlipped((f) => !f)}
      aria-label={flipped ? 'Flip back to portrait' : 'Flip to pixel portrait'}
    >
      <div className="digital-me-flip-inner">
        <div className="digital-me-face digital-me-front">
          <img
            src="/digital-me.png"
            alt="Kerry Anne"
            className="digital-me-photo"
            draggable={false}
          />
        </div>
        <div className="digital-me-face digital-me-back">
          <PixelSprite sprite={backSprite} title="Pixel portrait" />
          <span className="digital-me-back-label">digital_me.exe</span>
        </div>
      </div>
      <span className="digital-me-hint" aria-hidden="true">
        {flipped ? '← flip back' : 'click me →'}
      </span>
    </button>
  );
}
