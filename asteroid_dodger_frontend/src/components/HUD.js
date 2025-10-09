import React, { useEffect, useRef, useState } from 'react';
import ScoreDisplay from './ScoreDisplay';
import SoundManager from './SoundManager';
import { loadLocalBestScore } from '../services/bestScore';

/**
 * HUD shows current score, audio controls, and exposes a Restart button when game over.
 *
 * Props:
 * - score: number
 * - gameOver: boolean
 * - onRestart: function
 * - onToggleMute: optional function to toggle mute (if managed externally)
 * - bestScore?: optional best score to display (falls back to local storage)
 */
// PUBLIC_INTERFACE
export default function HUD({ score, gameOver, onRestart, onToggleMute, bestScore }) {
  const soundRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [localBest, setLocalBest] = useState(() => loadLocalBestScore());

  // Initialize muted state from SoundManager
  useEffect(() => {
    const sm = soundRef.current;
    if (sm && typeof sm.isMuted === 'function') {
      setMuted(!!sm.isMuted());
    }
  }, []);

  // Whenever bestScore prop changes, reflect it; otherwise keep local storage value.
  useEffect(() => {
    if (typeof bestScore === 'number' && bestScore >= 0) {
      setLocalBest(bestScore);
    } else {
      // resync from storage in case another tab updated it
      setLocalBest(loadLocalBestScore());
    }
  }, [bestScore]);

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

      <div className="badge" title="Best score">
        <span>Best</span>
        <span>•</span>
        <ScoreDisplay value={localBest} />
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
