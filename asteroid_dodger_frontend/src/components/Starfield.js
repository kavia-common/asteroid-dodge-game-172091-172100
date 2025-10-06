import React, { useEffect, useRef } from 'react';

/**
 * Starfield renders a performant parallax starfield using a single canvas and requestAnimationFrame.
 * It keeps animation state inside refs, avoiding React state updates per frame.
 * Layers: far, mid, near with different densities, sizes, opacities, and velocities.
 */
// PUBLIC_INTERFACE
export default function Starfield({ speed = 1, density = 1, color = '#ffffff' }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  // Animation refs
  const rafRef = useRef(0);
  const lastRef = useRef(0);

  // Stars per layer
  const farRef = useRef([]);
  const midRef = useRef([]);
  const nearRef = useRef([]);

  // Viewport size and DPR
  const dprRef = useRef(1);
  const widthRef = useRef(0);
  const heightRef = useRef(0);

  // Initialize and handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;

    const handleResize = () => {
      const parent = canvas.parentElement || document.body;
      const rect = parent.getBoundingClientRect();
      const w = Math.max(320, rect.width);
      const h = Math.max(320, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      widthRef.current = Math.floor(w);
      heightRef.current = Math.floor(h);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${Math.floor(w)}px`;
      canvas.style.height = `${Math.floor(h)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Rebuild stars for new size
      buildStars();
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas.parentElement || canvas);

    handleResize();
    lastRef.current = performance.now();

    const loop = (t) => {
      rafRef.current = requestAnimationFrame(loop);
      const last = lastRef.current || t;
      const dt = Math.min(0.033, (t - last) / 1000);
      lastRef.current = t;
      draw(dt);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild stars when density changes
  useEffect(() => {
    buildStars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [density]);

  function buildStars() {
    const W = widthRef.current;
    const H = heightRef.current;
    if (!W || !H) return;

    // Densities for each layer based on base density and area
    const area = (W * H) / (480 * 800); // normalize vs phone-ish size
    const farCount = Math.floor(40 * density * area);
    const midCount = Math.floor(28 * density * area);
    const nearCount = Math.floor(16 * density * area);

    farRef.current = makeLayer(farCount, W, H, { size: [0.5, 1.0], alpha: [0.15, 0.3], vy: [8, 16] });
    midRef.current = makeLayer(midCount, W, H, { size: [0.8, 1.6], alpha: [0.25, 0.45], vy: [16, 32] });
    nearRef.current = makeLayer(nearCount, W, H, { size: [1.2, 2.2], alpha: [0.35, 0.65], vy: [32, 56] });
  }

  function makeLayer(count, W, H, params) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * W,
        y: Math.random() * H,
        s: rand(params.size[0], params.size[1]),
        a: rand(params.alpha[0], params.alpha[1]),
        vy: rand(params.vy[0], params.vy[1]),
      });
    }
    return arr;
  }

  function draw(dt) {
    const ctx = ctxRef.current;
    const W = widthRef.current;
    const H = heightRef.current;
    if (!ctx || !W || !H) return;

    // Clear only the star canvas, it sits under the game canvas
    ctx.clearRect(0, 0, W, H);

    // Composite subtle glow under stars
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Draw layers: far -> mid -> near
    drawLayer(ctx, farRef.current, dt, speed * 0.35, color, W, H);
    drawLayer(ctx, midRef.current, dt, speed * 0.7, color, W, H);
    drawLayer(ctx, nearRef.current, dt, Math.min(speed * 1.0, 3.5), color, W, H);

    ctx.restore();
  }

  function drawLayer(ctx, layer, dt, layerSpeedScale, colorHex, W, H) {
    const col = hexToRgb(colorHex);
    for (let i = 0; i < layer.length; i++) {
      const star = layer[i];
      // Move downward; wrap when passing bottom
      star.y += star.vy * layerSpeedScale * dt;
      if (star.y > H + 4) {
        star.y = -4;
        star.x = Math.random() * W;
      }
      ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${star.a})`;
      // Use small squares for crisp stars
      ctx.fillRect(star.x, star.y, star.s, star.s);
      // occasional twinkle
      if ((i % 16) === 0) {
        ctx.fillRect(star.x + 0.5, star.y + 0.5, 0.5, 0.5);
      }
    }
  }

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        display: 'block',
      }}
    />
  );
}
