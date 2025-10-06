import React from 'react';

/**
 * HUD shows current score and overlays Game Over with Restart action.
 */
// PUBLIC_INTERFACE
export default function HUD({ score, gameOver, onRestart }) {
  return (
    <div className="hud" role="status" aria-live="polite">
      <div className="badge" title="Score">
        <span>Score</span>
        <span>•</span>
        <strong>{score}</strong>
      </div>

      {gameOver && (
        <button className="btn btn-primary" onClick={onRestart} aria-label="Restart game">
          ↻ Restart
        </button>
      )}
    </div>
  );
}
