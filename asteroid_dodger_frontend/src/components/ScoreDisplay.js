import React, { useEffect, useRef, useState } from 'react';

/**
 * ScoreDisplay renders the score and triggers a brief "bump" animation
 * when the score increases. Bump is debounced to avoid constant pulsing
 * on rapid score updates (e.g., each frame).
 *
 * Props:
 * - value: number (score)
 * - className: optional class
 */
// PUBLIC_INTERFACE
export default function ScoreDisplay({ value = 0, className = '' }) {
  const [bump, setBump] = useState(false);
  const lastValueRef = useRef(value);
  const timeoutRef = useRef(0);
  const lastBumpTimeRef = useRef(0);

  useEffect(() => {
    const now = performance.now();
    const increased = value > lastValueRef.current;
    lastValueRef.current = value;

    if (!increased) return;

    // Throttle bump to at most ~1 every 120ms
    if (now - lastBumpTimeRef.current < 120) return;
    lastBumpTimeRef.current = now;

    setBump(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setBump(false), 180);
  }, [value]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <strong className={`score-display ${bump ? 'score-bump' : ''} ${className}`}>
      {value}
    </strong>
  );
}
