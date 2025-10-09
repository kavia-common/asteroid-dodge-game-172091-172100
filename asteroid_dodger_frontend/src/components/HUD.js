import React, { useEffect, useRef, useState } from 'react';
import ScoreDisplay from './ScoreDisplay';
import SoundManager from './SoundManager';
import { loadLocalBestScore } from '../services/bestScore';
import { useAuth } from '../context/AuthProvider';

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

export default function HUD({ score, gameOver, onRestart, onToggleMute, bestScore }) {
  const soundRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [localBest, setLocalBest] = useState(() => loadLocalBestScore());
  const lastClickRef = useRef(0);

  // Initialize muted state from SoundManager and storage
  useEffect(() => {
    // Try to read from SoundManager (single source of truth)
    const sm = soundRef.current;
    if (sm && typeof sm.isMuted === 'function') {
      setMuted(!!sm.isMuted());
    } else {
      try {
        const v = localStorage.getItem('sound-muted');
        if (v === 'true' || v === 'false') setMuted(v === 'true');
      } catch {}
    }
  }, []);

  // Whenever bestScore prop changes, reflect it; otherwise keep local storage value.
  useEffect(() => {
    if (typeof bestScore === 'number' && bestScore >= 0) {
      setLocalBest(bestScore);
    } else {
      setLocalBest(loadLocalBestScore());
    }
  }, [bestScore]);

  // Keep local UI in sync if external toggle happens
  const handleToggleMute = async () => {
    // debounce rapid clicks
    const now = performance.now();
    if (now - lastClickRef.current < 120) {
      return;
    }
    lastClickRef.current = now;

    const sm = soundRef.current;
    if (sm?.ensureUnlocked) {
      try { await sm.ensureUnlocked(); } catch {}
    }
    if (sm && typeof sm.toggleMute === 'function') {
      sm.toggleMute();
      // read back from authoritative source
      const next = !!sm.isMuted();
      setMuted(next);
      // eslint-disable-next-line no-console
      try { console.log('[HUD] Muted state ->', next); } catch {}
    }
    if (onToggleMute) onToggleMute();
  };

  return (
    <div className="hud" role="status" aria-live="polite">
      {/* Hidden audio elements with imperative API (no enable button here to avoid duplicates) */}
      <SoundManager ref={soundRef} enableButton={false} />

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
