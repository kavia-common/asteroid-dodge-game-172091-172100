import React, { useEffect, useRef, useState } from 'react';
import ScoreDisplay from './ScoreDisplay';
import SoundManager from './SoundManager';

/**
 * HUD shows current score, audio controls, and exposes a Restart button when game over.
 *
 * Props:
 * - score: number
 * - gameOver: boolean
 * - onRestart: function
 * - onToggleMute: optional function to toggle mute (if managed externally)
 */
// PUBLIC_INTERFACE
export default function HUD({ score, gameOver, onRestart, onToggleMute }) {
  const soundRef = useRef(null);
  const [muted, setMuted] = useState(false);

  // Initialize muted state from SoundManager
  useEffect(() => {
    const sm = soundRef.current;
    if (sm && typeof sm.isMuted === 'function') {
      setMuted(!!sm.isMuted());
    }
  }, []);

  // Keep local UI in sync if external toggle happens
  const handleToggleMute = () => {
    const sm = soundRef.current;
    if (sm && typeof sm.toggleMute === 'function') {
      sm.toggleMute();
      setMuted(!!sm.isMuted());
    }
    if (onToggleMute) onToggleMute();
  };

  return (
    <div className="hud" role="status" aria-live="polite">
      {/* Hidden audio elements with imperative API */}
      <SoundManager ref={soundRef} />

      <div className="badge" title="Score">
        <span>Score</span>
        <span>•</span>
        <ScoreDisplay value={score} />
      </div>

      <button
        className={`btn ${muted ? '' : 'btn-primary'}`}
        onClick={handleToggleMute}
        aria-label={muted ? 'Unmute audio' : 'Mute audio'}
        title={muted ? 'Unmute audio' : 'Mute audio'}
      >
        {muted ? '🔇 Mute' : '🔊 Sound'}
      </button>

      {gameOver && (
        <button className="btn btn-primary" onClick={onRestart} aria-label="Restart game">
          ↻ Restart
        </button>
      )}
    </div>
  );
}
