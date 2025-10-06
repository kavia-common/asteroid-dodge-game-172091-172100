import React, { useEffect, useImperativeHandle, useMemo, useRef, forwardRef, useState } from 'react';

/**
 * SoundManager provides lightweight audio playback for:
 * - Movement sfx (throttled)
 * - Collision sfx
 * - Background music loop
 *
 * Uses <audio> elements with small data URIs for tones.
 * Exposes imperative methods via ref to avoid re-renders.
 *
 * Methods:
 * - playMove()
 * - playHit()
 * - startMusic()
 * - stopMusic()
 * - toggleMute()
 * - setMuted(boolean)
 * - isMuted(): boolean
 */
// PUBLIC_INTERFACE
const SoundManager = forwardRef(function SoundManager(_, ref) {
  // Persist mute preference within session
  const [muted, setMuted] = useState(() => {
    try {
      const v = sessionStorage.getItem('sound-muted');
      return v === 'true';
    } catch {
      return false;
    }
  });

  // Audio refs
  const moveRef = useRef(null);
  const hitRef = useRef(null);
  const musicRef = useRef(null);
  const lastMoveTimeRef = useRef(0);

  // Data URIs: simple short WAV/MP3-like beeps (base64). These are placeholders.
  // They are extremely small and royalty-free.
  const sources = useMemo(
    () => ({
      move:
        'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQcAAAABAQH//wAAAP//AQEAAAAA', // tiny click
      hit:
        'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQYAAAABAAD/AP//AAD/AAAA', // tiny pop
      music:
        // A very small loop tone. Intentionally minimal to keep bundle tiny.
        'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YRMBAAABAQEBAQABAQEBAQABAQEB',
    }),
    []
  );

  // Keep <audio> elements in sync with mute state
  useEffect(() => {
    const elms = [moveRef.current, hitRef.current, musicRef.current];
    elms.forEach((el) => {
      if (!el) return;
      el.muted = muted;
      el.volume = muted ? 0 : el === musicRef.current ? 0.25 : 0.5;
    });
    try {
      sessionStorage.setItem('sound-muted', String(muted));
    } catch {
      // ignore
    }
  }, [muted]);

  useImperativeHandle(ref, () => ({
    // PUBLIC_INTERFACE
    playMove() {
      const now = performance.now();
      if (now - lastMoveTimeRef.current < 80) return; // throttle to avoid spam
      lastMoveTimeRef.current = now;
      const el = moveRef.current;
      if (!el) return;
      try {
        el.currentTime = 0;
        el.play();
      } catch {
        // Autoplay restrictions could block; ignore
      }
    },
    // PUBLIC_INTERFACE
    playHit() {
      const el = hitRef.current;
      if (!el) return;
      try {
        el.currentTime = 0;
        el.play();
      } catch {
        // ignore
      }
    },
    // PUBLIC_INTERFACE
    startMusic() {
      const el = musicRef.current;
      if (!el) return;
      el.loop = true;
      try {
        el.play();
      } catch {
        // ignore
      }
    },
    // PUBLIC_INTERFACE
    stopMusic() {
      const el = musicRef.current;
      if (!el) return;
      try {
        el.pause();
        el.currentTime = 0;
      } catch {
        // ignore
      }
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
  }));

  return (
    <div style={{ display: 'none' }} aria-hidden="true">
      <audio ref={moveRef} src={sources.move} preload="auto" />
      <audio ref={hitRef} src={sources.hit} preload="auto" />
      <audio ref={musicRef} src={sources.music} preload="auto" />
    </div>
  );
});

export default SoundManager;
