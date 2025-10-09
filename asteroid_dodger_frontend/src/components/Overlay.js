import React, { useEffect, useRef } from 'react';

/**
 * Overlay displays start or game-over panels with smooth fade transitions.
 *
 * Props:
 * - isVisible: boolean - whether the overlay is shown
 * - type: 'start' | 'gameover' - controls message
 * - onPrimaryAction: function - called when main button pressed
 * - onSecondaryAction: function - optional secondary action
 * - children: optional extra content
 *
 * The component uses CSS classes for fade-in/out and does not block input when hidden.
 */
// PUBLIC_INTERFACE
export default function Overlay({
  isVisible = false,
  type = 'start',
  onPrimaryAction,
  onSecondaryAction,
  children,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Toggle aria-hidden based on visibility for accessibility
    el.setAttribute('aria-hidden', String(!isVisible));
  }, [isVisible]);

  const title =
    type === 'gameover' ? 'Game Over' : 'Asteroid Dodger';
  const subtitle =
    type === 'gameover'
      ? 'You were hit by an asteroid.'
      : 'Use ← → or A / D to move. Survive as long as possible!';

  const primaryLabel = type === 'gameover' ? '↻ Restart' : '▶ Start';

  return (
    <div
      ref={containerRef}
      className={`overlay-root ${isVisible ? 'overlay-visible' : 'overlay-hidden'}`}
      role="dialog"
      data-testid="overlay-root"
    >
      <div className="overlay-panel">
        <div className="overlay-title">{title}</div>
        <div className="overlay-subtitle">{subtitle}</div>
        {children ? <div className="overlay-extra">{children}</div> : null}
        <div className="overlay-actions">
          <button
            className="btn btn-primary"
            onClick={onPrimaryAction}
            aria-label={primaryLabel}
          >
            {primaryLabel}
          </button>
          {onSecondaryAction ? (
            <button className="btn" onClick={onSecondaryAction}>
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
