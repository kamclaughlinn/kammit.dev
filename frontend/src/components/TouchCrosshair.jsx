import { useState, useEffect, useRef } from 'react';
import './TouchCrosshair.css';

function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches
    || window.matchMedia('(hover: none)').matches;
}

export default function TouchCrosshair() {
  const [enabled, setEnabled] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(false);
  const fadeTimer = useRef(null);

  useEffect(() => {
    const update = () => setEnabled(isTouchDevice());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    function clearFade() {
      if (fadeTimer.current) {
        clearTimeout(fadeTimer.current);
        fadeTimer.current = null;
      }
    }

    function onTouchStart(e) {
      const touch = e.touches[0];
      if (!touch) return;
      clearFade();
      setPos({ x: touch.clientX, y: touch.clientY });
      setVisible(true);
      setActive(true);
    }

    function onTouchMove(e) {
      const touch = e.touches[0];
      if (!touch) return;
      setPos({ x: touch.clientX, y: touch.clientY });
    }

    function onTouchEnd() {
      setActive(false);
      clearFade();
      fadeTimer.current = setTimeout(() => setVisible(false), 450);
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      clearFade();
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [enabled]);

  if (!enabled || !visible) return null;

  return (
    <div
      className={`touch-crosshair ${active ? 'is-active' : 'is-fading'}`}
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      aria-hidden="true"
    />
  );
}
