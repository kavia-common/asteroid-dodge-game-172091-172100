import React, { useEffect, useRef } from 'react';
import Overlay from './Overlay';
import ScoreDisplay from './ScoreDisplay';

/**
 * GameOverOverlay
 * Wrapper that reuses the shared Overlay component with the same structure and classes
 * as the Start overlay to guarantee identical z-index, positioning, and visibility.
 *
 * Props:
 * - isOpen: boolean - whether overlay is visible
 * - finalScore: number - last run score
 * - bestScore: number - best score to date (local or synced)
 * - onRestart: function - called to start a new game
 *
 * Behavior:
 * - Focus first actionable element on open (primary button)
 * - ESC triggers restart (mirrors Start overlay keyboard handling)
 */
// PUBLIC_INTERFACE
export default function GameOverOverlay({
  isOpen = false,
  finalScore = 0,
  bestScore = 0,
  onRestart,
}) {
  const btnRef = useRef(null);

  // Focus primary button when opened (parity with Start overlay intent)
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      try { btnRef.current?.focus(); } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, [isOpen]);

  // ESC to restart (mirrors Start overlay behavior requirement)
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onRestart && onRestart();
      }
    };
    document.addEventListener('keydown', handle, true);
    return () => document.removeEventListener('keydown', handle, true);
  }, [isOpen, onRestart]);

  return (
    <div data-testid="gameover-overlay-root">
      <Overlay
        isVisible={isOpen}
        type="gameover"
        onPrimaryAction={onRestart}
      >
        {/* Shared Overlay already provides title/subtitle based on type.
            We supply additional score content in the slot to preserve styling and structure. */}
        <div className="overlay-extra" style={{ display: 'grid', gap: 10, marginTop: 6 }}>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <div className="badge" title="Final score">
              <span className="hud-label">Score</span>
              <span className="separator">•</span>
              <ScoreDisplay className="hud-value" value={finalScore} />
            </div>
            <div className="badge" title="Best score">
              <span className="hud-label">Best</span>
              <span className="separator">•</span>
              <ScoreDisplay className="hud-value" value={bestScore} />
            </div>
          </div>
          <div className="small" style={{ textAlign: 'center' }}>
            Tip: Use ← → or A / D to move. Press ESC to restart quickly.
          </div>
        </div>

        {/* We also need to ensure first actionable element receives focus.
            Overlay renders its primary button inside .overlay-actions; we attach a ref by post-mount query. */}
        <FocusPrimaryButtonHook isOpen={isOpen} btnRef={btnRef} />
      </Overlay>
    </div>
  );
}

function FocusPrimaryButtonHook({ isOpen, btnRef }) {
  useEffect(() => {
    if (!isOpen) return;
    // Query the primary button inside the shared Overlay panel
    const root = document.querySelector('.overlay-root.overlay-visible');
    const primary = root?.querySelector('.overlay-panel .overlay-actions .btn-primary');
    if (primary && btnRef) {
      // Assign ref current for potential future use and focus now
      btnRef.current = primary;
      try { primary.focus(); } catch {}
    }
  }, [isOpen, btnRef]);
  return null;
}
