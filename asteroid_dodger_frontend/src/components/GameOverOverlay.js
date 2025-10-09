import React, { useEffect, useRef } from 'react';
import ScoreDisplay from './ScoreDisplay';

/**
 * GameOverOverlay
 * Accessible modal-style overlay for Game Over state.
 *
 * Props:
 * - isOpen: boolean - whether overlay is visible
 * - finalScore: number - last run score
 * - bestScore: number - best score to date (local or synced)
 * - onRestart: function - called to start a new game
 *
 * Accessibility:
 * - role="dialog" with aria-modal
 * - focus trap while open
 * - ESC key restarts (per requirement to close/restart)
 * - Initial focus set to the primary action
 */
// PUBLIC_INTERFACE
export default function GameOverOverlay({
  isOpen = false,
  finalScore = 0,
  bestScore = 0,
  onRestart,
}) {
  const overlayRef = useRef(null);
  const btnRef = useRef(null);

  // Focus management: move focus to button when opening
  useEffect(() => {
    if (isOpen && btnRef.current) {
      // delay to ensure element is mounted
      const t = setTimeout(() => {
        try { btnRef.current.focus(); } catch {}
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Simple focus trap and ESC handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onRestart) onRestart();
        return;
      }
      if (e.key === 'Tab') {
        // Focus trap within overlay
        const focusable = overlayRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onRestart]);

  // Hide when closed
  // Add a temporary debug class to help detect visibility/z-index issues.
  // Remove 'go-debug' after verifying overlay is visible in all states.
  const rootClass = `go-root ${isOpen ? 'go-open' : 'go-closed'} go-debug`;

  return (
    <div
      className={rootClass}
      aria-hidden={!isOpen}
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
    >
      {/* Backdrop to dim/blur game area */}
      <div className="go-backdrop" />

      {/* Dialog panel */}
      <div
        ref={overlayRef}
        className="go-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="go-title"
        aria-describedby="go-desc"
      >
        <div className="go-title" id="go-title">Game Over</div>
        <div className="go-sub" id="go-desc">
          You were hit by an asteroid. Try again to beat your best!
        </div>

        <div className="go-scores">
          <div className="go-score">
            <span className="go-score-label">Score</span>
            <ScoreDisplay className="go-score-value" value={finalScore} />
          </div>
          <div className="go-score">
            <span className="go-score-label">Best</span>
            <ScoreDisplay className="go-score-value" value={bestScore} />
          </div>
        </div>

        <div className="go-actions">
          <button
            ref={btnRef}
            className="btn btn-primary"
            onClick={onRestart}
            aria-label="Play again"
          >
            ↻ Play Again
          </button>
        </div>

        <div className="small" style={{ marginTop: 8, color: 'var(--op-muted)' }}>
          Tip: Use ← → or A / D to move. Press ESC to restart quickly.
        </div>
      </div>
    </div>
  );
}
