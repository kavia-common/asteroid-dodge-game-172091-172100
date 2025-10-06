import { useEffect, useRef } from 'react';

/**
 * BackgroundGradient updates CSS variables --bg1 and --bg2 on :root
 * to create a subtle shift from deep blue to near-black as progression increases.
 *
 * progression: 0.0 .. 1.0
 */
// PUBLIC_INTERFACE
export default function BackgroundGradient({ progression = 0 }) {
  const lastRef = useRef(-1);

  useEffect(() => {
    const p = clamp(progression, 0, 1);
    if (Math.abs(p - lastRef.current) < 0.005) return; // avoid excessive writes
    lastRef.current = p;

    // Start and end colors
    const start1 = hexToRgb('#0b1e44'); // deep blue
    const end1 = hexToRgb('#0a1533');   // deeper
    const start2 = hexToRgb('#0a1430'); // dark blue-gray
    const end2 = hexToRgb('#020617');   // near-black

    const c1 = lerpColor(start1, end1, p);
    const c2 = lerpColor(start2, end2, p);

    const root = document.documentElement;
    root.style.setProperty('--bg1', `rgb(${c1.r}, ${c1.g}, ${c1.b})`);
    root.style.setProperty('--bg2', `rgb(${c2.r}, ${c2.g}, ${c2.b})`);
  }, [progression]);

  return null;
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
function lerp(a, b, t) { return a + (b - a) * t; }
function lerpColor(c1, c2, t) {
  return { r: Math.round(lerp(c1.r, c2.r, t)), g: Math.round(lerp(c1.g, c2.g, t)), b: Math.round(lerp(c1.b, c2.b, t)) };
}
