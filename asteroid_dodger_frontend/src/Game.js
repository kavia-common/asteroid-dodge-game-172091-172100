import React, { useEffect, useImperativeHandle, useRef, forwardRef, useState } from 'react';
import ThrusterEffect from './components/ThrusterEffect';
import Explosion from './components/Explosion';
import Overlay from './components/Overlay';
import { computeRenderSize, getSizePresetFromQuery } from './config/dimensions';

/**
 * Game component encapsulates the Asteroid Dodger gameplay using a canvas and requestAnimationFrame.
 * Uses refs for mutable state to avoid unnecessary React re-renders.
 *
 * Updated flow:
 * - Game Over overlay removed. On collision, gameplay pauses (aliveRef=false), and HUD Restart is used.
 * - Start overlay remains for the initial start only.
 */
// PUBLIC_INTERFACE
const Game = forwardRef(function Game({ onScore, onGameOver, running }, ref) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  // Render scale management
  const renderScaleRef = useRef(1);
  const presetRef = useRef(getSizePresetFromQuery());

  // Mutable game state (normalized 0..1 positions/sizes)
  const shipRef = useRef({ x: 0.5, y: 0.92, w: 0.08, h: 0.04, speed: 0.55 });
  const inputsRef = useRef({ left: false, right: false });
  const asteroidsRef = useRef([]);
  const lastTimeRef = useRef(0);
  const accSpawnRef = useRef(0);
  const spawnIntervalRef = useRef(0.9); // seconds, will decrease
  const speedScaleRef = useRef(1);
  const scoreRef = useRef(0);
  const aliveRef = useRef(true);
  const emojiSupportRef = useRef(true);

  // When React StrictMode re-mounts components, ensure loop/handlers are not duplicated by
  // keeping mutable flags in refs instead of re-creating the effect for state changes.
  const runningRef = useRef(Boolean(running));
  const hasStartedRef = useRef(false);

  // UI overlay states
  const [tilt, setTilt] = useState('');
  const [explosions, setExplosions] = useState([]);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => { runningRef.current = Boolean(running); }, [running]);
  useEffect(() => { hasStartedRef.current = Boolean(hasStarted); }, [hasStarted]);

  // Expose restart to parent (HUD/Controls call this via App)
  useImperativeHandle(ref, () => ({
    // PUBLIC_INTERFACE
    restart() {
      // If never started, treat restart as starting the first round
      if (!hasStarted) {
        setHasStarted(true);
        hasStartedRef.current = true;
      }
      resetGame();
    }
  }));

  // Initialize canvas context and keyboard handling (mount once)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      // eslint-disable-next-line no-console
      console.error('[Game] Canvas ref is null on mount.');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      // eslint-disable-next-line no-console
      console.error('[Game] 2D context not available.');
      return;
    }
    ctxRef.current = ctx;

    // Detect rough emoji rendering support (fallback to shapes)
    emojiSupportRef.current = true;
    try {
      ctx.font = '20px system-ui, Apple Color Emoji, Segoe UI Emoji';
      const m = ctx.measureText('🚀');
      if (!m || m.width < 5) emojiSupportRef.current = false;
    } catch {
      emojiSupportRef.current = false;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        inputsRef.current.left = true;
        setTilt('tilt-left');
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        inputsRef.current.right = true;
        setTilt('tilt-right');
      }

      // When game over, block game controls (no overlay/ESC handler)
      if (hasStartedRef.current && !aliveRef.current) {
        e.preventDefault();
        return;
      }

      // Start game via keyboard from start overlay
      if (!hasStartedRef.current && (e.key === 'Enter' || e.key === ' ')) {
        setHasStarted(true);
        hasStartedRef.current = true;
        resetGame();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputsRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputsRef.current.right = false;
      const { left, right } = inputsRef.current;
      setTilt(right ? 'tilt-right' : left ? 'tilt-left' : '');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Throttle resize handler to the next animation frame to avoid RO loop warnings.
    let resizeRaf = 0;
    const doResize = () => {
      const container = wrapperRef.current;
      const rect = container ? container.getBoundingClientRect() : { width: 640, height: 480 };
      const viewportH = window.innerHeight || rect.height || 720;

      const { width, height, scale } = computeRenderSize(
        Number(rect.width) || 640,
        viewportH,
        { preset: presetRef.current }
      );

      renderScaleRef.current = isFiniteNumber(scale) ? scale : 1;

      // Apply CSS size and back the internal buffer with DPR for crisp text/emojis
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.max(200, Math.floor(width));
      const cssH = Math.max(150, Math.floor(height));
      canvas.width = Math.max(200, Math.floor(width * dpr));
      canvas.height = Math.max(150, Math.floor(height * dpr));
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      if (ctxRef.current && typeof ctxRef.current.setTransform === 'function') {
        ctxRef.current.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // First-frame debug draw to verify rendering path
      try {
        const ctx2 = ctxRef.current;
        if (ctx2) {
          const W = canvas.width / (ctx2.getTransform?.().a || dpr || 1);
          const H = canvas.height / (ctx2.getTransform?.().d || dpr || 1);
          ctx2.clearRect(0, 0, W, H);
          ctx2.fillStyle = '#00FF88';
          ctx2.fillRect(8, 8, 8, 8); // tiny debug square
          ctx2.fillStyle = '#ffffff';
          ctx2.font = '10px system-ui, sans-serif';
          ctx2.fillText('dbg', 22, 16);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[Game] Debug draw failed:', e?.message || e);
      }

      // eslint-disable-next-line no-console
      try { console.debug('[Game] resize', { cssW, cssH, dpr, scale: renderScaleRef.current }); } catch {}
    };

    const scheduleResize = () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        doResize();
      });
    };

    // initial size
    doResize();

    // Observe container size changes (guard for environments without ResizeObserver)
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(scheduleResize);
      if (wrapperRef.current) ro.observe(wrapperRef.current);
    }
    // Also listen to window resize and potential DPR changes
    window.addEventListener('resize', scheduleResize);

    resetGame(); // set initial state (idle)

    let rafId;
    const loop = (t) => {
      rafId = requestAnimationFrame(loop);

      // Pause updates when not running, dead, or not started (start overlay)
      if (!runningRef.current || !aliveRef.current || !hasStartedRef.current) {
        // Keep last time in sync while paused and still render for overlays/idle frame
        lastTimeRef.current = t;
        render(); // render static frame
        return;
      }

      const last = lastTimeRef.current || t;
      const dt = Math.min(0.033, (t - last) / 1000);
      lastTimeRef.current = t;
      update(dt);
      render();
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', scheduleResize);
      ro?.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, []); // mount once

  // Reset or initialize game state
  function resetGame() {
    asteroidsRef.current = [];
    accSpawnRef.current = 0;
    spawnIntervalRef.current = 0.9;
    speedScaleRef.current = 1;
    scoreRef.current = 0;
    aliveRef.current = true;
    shipRef.current.x = 0.5;
    shipRef.current.y = 0.92;
    setExplosions([]);
    setTilt('');
    if (onScore) onScore(0);
  }

  function update(dt) {
    // Increase difficulty over time
    speedScaleRef.current += 0.03 * dt; // gradual
    spawnIntervalRef.current = Math.max(0.28, spawnIntervalRef.current - 0.02 * dt);

    // Move ship
    const ship = shipRef.current;
    const move = (inputsRef.current.right ? 1 : 0) - (inputsRef.current.left ? 1 : 0);
    ship.x += move * ship.speed * dt;
    if (!isFiniteNumber(ship.x)) ship.x = 0.5; // guard against NaN
    ship.x = Math.max(ship.w / 2, Math.min(1 - ship.w / 2, ship.x));

    // Spawn asteroids
    accSpawnRef.current += dt;
    if (accSpawnRef.current >= spawnIntervalRef.current) {
      accSpawnRef.current = 0;
      const r = rand(0.02, 0.06);
      const baseVy = rand(0.18, 0.32) * speedScaleRef.current;
      const angle = rand(0, Math.PI * 2);
      const rotSpeed = rand(-Math.PI, Math.PI) * 0.25; // radians/sec
      asteroidsRef.current.push({
        x: rand(0 + r, 1 - r),
        y: -r,
        r,
        vy: baseVy,
        angle,
        rotSpeed,
      });
    }

    // Move asteroids (including rotation update)
    const asts = asteroidsRef.current;
    for (let i = 0; i < asts.length; i++) {
      const a = asts[i];
      a.y += a.vy * dt;
      a.angle += a.rotSpeed * dt;
    }
    // Remove off-screen
    while (asts.length && asts[0].y - asts[0].r > 1.2) {
      asts.shift();
    }

    // Collision detection (ship rect vs asteroid circle)
    const shipRect = {
      x: ship.x - ship.w / 2,
      y: ship.y - ship.h / 2,
      w: ship.w,
      h: ship.h
    };
    for (let a of asts) {
      if (circleRectOverlap(a.x, a.y, a.r, shipRect)) {
        if (!aliveRef.current) break;

        // Mark dead to pause gameplay; do not show any overlay
        aliveRef.current = false;

        // Trigger explosion effect at ship position
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (canvas && ctx) {
          const scaleX = ctx.getTransform?.().a || 1;
          const scaleY = ctx.getTransform?.().d || 1;
          const W = canvas.width / scaleX;
          const H = canvas.height / scaleY;
          const px = ship.x * W;
          const py = ship.y * H;
          const id = Date.now() + Math.random();
          setExplosions((prev) => [...prev, { id, x: px, y: py, size: Math.min(W, H) * 0.22 }]);
        }

        if (onGameOver) onGameOver();
        break;
      }
    }

    // Score over time
    scoreRef.current += dt * 10; // 10 pts per second
    if (onScore) onScore(Math.floor(scoreRef.current));
  }

  function render() {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    // Use the internal canvas buffer size since we set DPR transform on context.
    const tr = ctx.getTransform?.();
    const scaleX = tr?.a || 1;
    const scaleY = tr?.d || 1;
    let W = canvas.width / scaleX;
    let H = canvas.height / scaleY;

    if (!isFiniteNumber(W) || !isFiniteNumber(H) || W <= 0 || H <= 0) {
      W = 640; H = 480;
    }

    // Clear
    ctx.clearRect(0, 0, W, H);

    // First-frame persistent tiny debug pixel to confirm draw path
    ctx.fillStyle = '#00FF88';
    ctx.fillRect(8, 8, 8, 8);

    // Draw ship
    const ship = shipRef.current;
    const shipPx = {
      x: ship.x * W,
      y: ship.y * H,
      w: ship.w * W,
      h: ship.h * H
    };

    // Guard against NaN during initial layout
    if (!isFiniteNumber(shipPx.x) || !isFiniteNumber(shipPx.y) || !isFiniteNumber(shipPx.w) || !isFiniteNumber(shipPx.h)) {
      return;
    }

    if (emojiSupportRef.current) {
      ctx.font = `${Math.floor(shipPx.h * 1.6)}px system-ui, Apple Color Emoji, Segoe UI Emoji`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('🚀', shipPx.x, shipPx.y);
    } else {
      // triangle ship
      ctx.fillStyle = '#9ecbff';
      ctx.beginPath();
      ctx.moveTo(shipPx.x, shipPx.y - shipPx.h / 1.2);
      ctx.lineTo(shipPx.x - shipPx.w / 2, shipPx.y + shipPx.h / 1.2);
      ctx.lineTo(shipPx.x + shipPx.w / 2, shipPx.y + shipPx.h / 1.2);
      ctx.closePath();
      ctx.fill();
    }

    // Draw asteroids
    const asts = asteroidsRef.current;
    for (let a of asts) {
      const ax = a.x * W;
      const ay = a.y * H;
      const r = a.r * Math.min(W, H);

      if (emojiSupportRef.current) {
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(a.angle || 0);
        ctx.font = `${Math.floor(r * 2)}px system-ui, Apple Color Emoji, Segoe UI Emoji`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('☄️', 0, 0);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(a.angle || 0);
        ctx.fillStyle = '#f1b86a';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    }

    // Optional bottom line for ground
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.95);
    ctx.lineTo(W, H * 0.95);
    ctx.stroke();
  }

  // Compute ship overlay position for CSS tilt and thruster placement
  const shipOverlay = (() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return { x: 0, y: 0, w: 0, h: 0 };
    const tr = ctx.getTransform?.();
    const scaleX = tr?.a || 1;
    const scaleY = tr?.d || 1;
    const W = (canvas.width / scaleX);
    const H = (canvas.height / scaleY);
    const ship = shipRef.current;
    return {
      x: ship.x * W,
      y: ship.y * H,
      w: ship.w * W,
      h: ship.h * H,
    };
  })();

  const showStartOverlay = !hasStarted;

  return (
    <div className="game-wrapper">
      <div className="canvas-container" ref={wrapperRef}>
        {/* Starfield sits behind this canvas via App */}
        <canvas className="canvas" ref={canvasRef} aria-label="Asteroid Dodger canvas" />

        {/* Overlay layer for ship tilt and thruster */}
        <div className="ship-overlay" aria-hidden="true">
          <div
            className={`ship ${tilt}`}
            style={{
              left: shipOverlay.x,
              top: shipOverlay.y,
              width: shipOverlay.w,
              height: shipOverlay.h,
              marginLeft: -shipOverlay.w / 2,
              marginTop: -shipOverlay.h / 2,
            }}
          >
            {/* Thruster positioned under the ship */}
            <ThrusterEffect
              size={Math.max(10, shipOverlay.h * 0.6)}
              intensity={1}
              flickerSpeed="520ms"
              style={{ bottom: -Math.max(6, shipOverlay.h * 0.25) }}
            />
          </div>
        </div>

        {/* Explosions overlay */}
        <div className="ship-overlay" aria-hidden="true">
          {explosions.map((ex) => (
            <Explosion
              key={ex.id}
              x={ex.x}
              y={ex.y}
              size={ex.size}
              duration="560ms"
              onComplete={() =>
                setExplosions((prev) => prev.filter((p) => p.id !== ex.id))
              }
            />
          ))}
        </div>

        {/* Start overlay only. No Game Over overlay. */}
        <Overlay
          isVisible={showStartOverlay}
          type="start"
          onPrimaryAction={() => {
            setHasStarted(true);
            hasStartedRef.current = true;
            resetGame();
          }}
        />
      </div>
      <div className="small" style={{ marginTop: 8 }}>
        Survive as long as possible. Score increases over time.
      </div>
    </div>
  );
});

// Helpers
function rand(a, b) { return a + Math.random() * (b - a); }

function circleRectOverlap(cx, cy, cr, rect) {
  // rect in normalized units
  const rx = rect.x, ry = rect.y, rw = rect.w, rh = rect.h;
  const testX = clamp(cx, rx, rx + rw);
  const testY = clamp(cy, ry, ry + rh);
  const dx = cx - testX;
  const dy = cy - testY;
  return (dx * dx + dy * dy) <= (cr * cr);
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function isFiniteNumber(n) { return typeof n === 'number' && Number.isFinite(n); }

export default Game;
