import React, { useEffect, useImperativeHandle, useRef, forwardRef, useState } from 'react';

/**
 * WebAudio-based SoundManager that complies with autoplay policies.
 * - Initializes/resumes AudioContext on first user gesture (click/keypress).
 * - Exposes imperative play methods for game events.
 * - Lazy-loads audio buffers if URLs provided; otherwise generates tones via Oscillator for graceful fallback.
 * - Persists mute preference in sessionStorage.
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
 * Minimal UI affordance: a tiny "Enable Sound" button appears until the context is unlocked or muted state disables it.
 */
// PUBLIC_INTERFACE
const SoundManager = forwardRef(function SoundManager({ enableButton = true }, ref) {
  // Store AudioContext and unlocked status
  const audioCtxRef = useRef(null);
  const unlockedRef = useRef(false);
  const musicNodeRef = useRef(null); // persistent music node
  const lastMoveTimeRef = useRef(0);
  const [muted, setMuted] = useState(() => {
    try {
      const v = sessionStorage.getItem('sound-muted');
      return v === 'true';
    } catch {
      return false;
    }
  });
  const [needsUnlock, setNeedsUnlock] = useState(true);

  // Create or get AudioContext (deferred)
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

  // Attempt to resume context; should be triggered on user gesture
  async function unlockAudio() {
    const ctx = getAudioContext();
    if (!ctx) {
      // no WebAudio support; keep graceful no-op behavior
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
    setNeedsUnlock(!unlockedRef.current && !muted);
  }

  // Persist mute preference
  useEffect(() => {
    try {
      sessionStorage.setItem('sound-muted', String(muted));
    } catch {}
    // If muted, stop music immediately
    if (muted) {
      stopMusic();
    }
  }, [muted]);

  // Utility: create a short tone buffer if assets are absent
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
    // simple envelope
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0005, now + Math.max(0.02, dur));
    osc.stop(now + dur + 0.02);
  }

  // Background "music": a gentle low-volume triangle tone pulsing
  function startMusic() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx || !unlockedRef.current) return;
    if (musicNodeRef.current) return; // already playing
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 220;
    g.gain.value = 0.0; // start silent, then fade in
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
      const nowTs = performance.now();
      if (nowTs - lastMoveTimeRef.current < 80) return; // throttle
      lastMoveTimeRef.current = nowTs;
      // short blip
      playTone({ freq: 660, dur: 0.05, type: 'square', gain: 0.12 });
    },
    // PUBLIC_INTERFACE
    playHit() {
      // descending chirp effect via two quick tones
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
      setMuted((m) => !m);
    },
    // PUBLIC_INTERFACE
    setMuted(v) {
      setMuted(Boolean(v));
    },
    // PUBLIC_INTERFACE
    isMuted() {
      return muted;
    },
    // PUBLIC_INTERFACE
    isUnlocked() {
      return unlockedRef.current;
    },
  }));

  // Attach one-time global listeners to unlock audio on user gesture
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

  // Inline minimal UI "Enable Sound" affordance inside a visually hidden-ish container
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
      {/* No visible audio elements necessary when using WebAudio */}
      <div style={{ display: 'none' }} aria-hidden="true" />
    </>
  );
});

export default SoundManager;
