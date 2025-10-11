import React from 'react';

/**
 * GameOverModal renders a compact panel with the final score and Mission Control message.
 *
 * Props:
 * - score: number
 * - missionMessage: string
 * - missionLoading: boolean
 * - onRestart: function
 */
// PUBLIC_INTERFACE
export default function GameOverModal({
  score = 0,
  missionMessage = '',
  missionLoading = false,
  onRestart,
}) {
  const msg = missionLoading
    ? 'Receiving transmission…'
    : (missionMessage || 'Signal lost. Try again, pilot!');

  return (
    <div className="game-card" style={{ marginTop: 12 }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <div className="score-large" aria-label="Final score">
          Final Score: {score}
        </div>
        <div className="small" style={{ color: 'var(--op-muted)' }}>
          💬 Mission Control: {msg}
        </div>
        <div style={{ marginTop: 4 }}>
          <button className="btn btn-primary" onClick={onRestart} aria-label="Restart game">
            ↻ Restart
          </button>
        </div>
      </div>
    </div>
  );
}
