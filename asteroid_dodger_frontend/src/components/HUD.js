import React from 'react';
import ScoreDisplay from './ScoreDisplay';
import { loadLocalBestScore } from '../services/bestScore';
import { useAuth } from '../context/AuthProvider';

/**
 * HUD shows necessary gameplay info (email if available, Score, Best) and a Restart button on game over.
 *
 * Props:
 * - score: number
 * - gameOver: boolean
 * - onRestart: function
 * - bestScore?: optional best score to display (falls back to local storage)
 */
// PUBLIC_INTERFACE
function EmailBadge() {
  const { user } = useAuth();
  if (!user?.email) return null;
  const email = String(user.email);
  return (
    <div className="badge" title="Signed in">
      <span className="hud-label">Email</span>
      <span className="separator">•</span>
      <span className="hud-value" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {email}
      </span>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function HUD({ score, gameOver, onRestart, bestScore }) {
  const localBest = typeof bestScore === 'number' && bestScore >= 0 ? bestScore : loadLocalBestScore();

  return (
    <div className="hud" role="status" aria-live="polite" style={{ flexWrap: 'wrap' }}>
      {/* Email display (if available) */}
      <EmailBadge />

      <div className="badge" title="Score">
        <span className="hud-label">Score</span>
        <span className="separator">•</span>
        <ScoreDisplay className="hud-value" value={score} />
      </div>

      <div className="badge" title="Best score">
        <span className="hud-label">Best</span>
        <span className="separator">•</span>
        <ScoreDisplay className="hud-value" value={localBest} />
      </div>

      {gameOver && (
        <button className="btn btn-primary" onClick={onRestart} aria-label="Restart game">
          ↻ Restart
        </button>
      )}
    </div>
  );
}
