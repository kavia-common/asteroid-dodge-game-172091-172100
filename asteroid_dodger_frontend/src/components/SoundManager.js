import React, { useEffect, useImperativeHandle, useRef, forwardRef, useState } from 'react';

/**
 * WebAudio-based SoundManager that complies with autoplay policies.
 * - Initializes/resumes AudioContext on first user gesture (click/keypress).
 * - Exposes imperative play methods for game events.
 * - Lazy-loads audio buffers if URLs provided; otherwise generates tones via Oscillator for graceful fallback.
 * - Persists mute preference in localStorage (single source of truth).
 *
 * Public methods (via ref):
 *  - ensureUnlocked(): Promise<void>  // call on first user gesture to resume context
 *  - playMove()
 *  - playHit()
 *  - startMusic()
 *  - stopMusic()
 *  - toggleMute()
 *  - setMuted(boolean)
 *  - isMuted(): boolean
 *
 * Notes:
 * - All play methods must respect isMuted() and unlocked state.
 * - Toggle is debounced to avoid rapid state flapping.
 * - Emits console logs for debugging state transitions.
 */
// PUBLIC_INTERFACE
const SoundManager = forwardRef(function SoundManager({ enableButton = true }, ref) {
  // Audio context and state
  const audioCtxRef = useRef(null);
  const unlockedRef = useRef(false);
  const musicNodeRef = useRef(null);
  const lastMoveTimeRef = useRef(0);

  // Single source of truth for mute: persisted to localStorage
  const [muted, setMutedState] = useState(() => {
    try {
      const v = localStorage.getItem('sound-muted');
      return v === 'true';
    } catch {
      return false;
    }
  });

  // UI affordance state
  const [needsUnlock, setNeedsUnlock] = useState(true);

  // Debounce toggle to avoid double clicks
  const lastToggleRef = useRef(0);
  function setMuted(next) {
    const now = performance.now();
    if (now - lastToggleRef.current < 120) {
      // eslint-disable-next-line no-console
      console.log('[SoundManager] Toggle ignored (debounced)');
      return;
    }
    lastToggleRef.current = now;
    setMutedState(Boolean(next));
  }

  function getAudioContext() {
    if (audioCtxRef.current) return audioCtxRef.current;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }

  async function unlockAudio() {
    const ctx = getAudioContext();
    if (!ctx) {
      unlockedRef.current = false;
      setNeedsUnlock(false);
      return;
    }
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // ignore
      }
    }
    unlockedRef.current = ctx.state === 'running';
    // eslint-disable-next-line no-console
    try { console.log('[SoundManager] unlockAudio ->', unlockedRef.current ? 'running' : ctx.state); } catch {}
    setNeedsUnlock(!unlockedRef.current && !muted);
  }

  // Persist mute preference and enforce behavior
  useEffect(() => {
    try {
      localStorage.setItem('sound-muted', String(muted));
    } catch {}
    // Keep "Enable Sound" button hidden if user mutes
    if (muted) setNeedsUnlock(false);
    // Stop music immediately on mute
    if (muted) {
      stopMusic();
    } else {
      // if unmuted and already unlocked, optionally keep music state as-is
      // eslint-disable-next-line no-console
      try { console.log('[SoundManager] Unmuted'); } catch {}
    }
  }, [muted]);

  // Low-level tone; respects mute + unlock
  function playTone({ freq = 440, dur = 0.08, type = 'square', gain = 0.25 }) {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx || !unlockedRef.current) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g).connect(ctx.destination);
    const now = ctx.currentTime;
    osc.start(now);
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0005, now + Math.max(0.02, dur));
    osc.stop(now + dur + 0.02);
  }

  function startMusic() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx || !unlockedRef.current) return;
    if (musicNodeRef.current) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 220;
    g.gain.value = 0.0;
    osc.connect(g).connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.0, now);
    g.gain.linearRampToValueAtTime(0.08, now + 0.6);
    osc.start(now);
    musicNodeRef.current = { osc, g };
  }

  function stopMusic() {
    const ctx = audioCtxRef.current;
    if (musicNodeRef.current) {
      const { osc, g } = musicNodeRef.current;
      const now = ctx ? ctx.currentTime : 0;
      try {
        if (g && ctx) {
          g.gain.cancelScheduledValues(now);
          g.gain.setValueAtTime(g.gain.value, now);
          g.gain.linearRampToValueAtTime(0.0001, now + 0.25);
        }
      } catch {}
      try {
        osc.stop(now + 0.26);
      } catch {}
      musicNodeRef.current = null;
    }
  }

  // Expose imperative API
  useImperativeHandle(ref, () => ({
    // PUBLIC_INTERFACE
    async ensureUnlocked() {
      await unlockAudio();
    },
    // PUBLIC_INTERFACE
    playMove() {
      if (muted) return;
      const nowTs = performance.now();
      if (nowTs - lastMoveTimeRef.current < 80) return;
      lastMoveTimeRef.current = nowTs;
      playTone({ freq: 660, dur: 0.05, type: 'square', gain: 0.12 });
    },
    // PUBLIC_INTERFACE
    playHit() {
      if (muted) return;
      playTone({ freq: 220, dur: 0.08, type: 'sawtooth', gain: 0.18 });
      setTimeout(() => playTone({ freq: 110, dur: 0.07, type: 'sawtooth', gain: 0.18 }), 60);
    },
    // PUBLIC_INTERFACE
    startMusic() {
      startMusic();
    },
    // PUBLIC_INTERFACE
    stopMusic() {
      stopMusic();
    },
    // PUBLIC_INTERFACE
    toggleMute() {
      setMuted(!muted);
      // eslint-disable-next-line no-console
      try { console.log('[SoundManager] toggleMute ->', !muted); } catch {}
    },
    // PUBLIC_INTERFACE
    setMuted(v) {
      setMuted(Boolean(v));
      // eslint-disable-next-line no-console
      try { console.log('[SoundManager] setMuted ->', Boolean(v)); } catch {}
    },
    // PUBLIC_INTERFACE
    isMuted() {
      return muted;
    },
    // PUBLIC_INTERFACE
    isUnlocked() {
      return unlockedRef.current;
    },
  }), [muted]);

  // Attach unlock listeners only when needed and not muted
  useEffect(() => {
    if (muted) {
      setNeedsUnlock(false);
      return;
    }
    const handler = async () => {
      await unlockAudio();
      if (unlockedRef.current) {
        document.removeEventListener('pointerdown', handler);
        document.removeEventListener('keydown', handler);
      }
    };
    document.addEventListener('pointerdown', handler, { passive: true });
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('pointerdown', handler);
      document.removeEventListener('keydown', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted]);

  // Show "Enable Sound" only when not muted and needs unlock
  const showEnable = enableButton && !muted && needsUnlock;

  return (
    <>
      {showEnable && (
        <div
          style={{
            position: 'absolute',
            zIndex: 5,
            right: 8,
            bottom: 8,
            pointerEvents: 'auto',
          }}
        >
          <button
            className="btn btn-primary"
            onClick={unlockAudio}
            title="Enable Sound"
            aria-label="Enable Sound"
          >
            🔊 Enable Sound
          </button>
        </div>
      )}
      {/* Invisible node for a11y grouping */}
      <div style={{ display: 'none' }} aria-hidden="true" />
    </>
  );
});

export default SoundManager;
