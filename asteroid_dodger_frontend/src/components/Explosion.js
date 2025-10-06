import React, { useEffect, useRef } from 'react';

/**
 * Explosion renders a quick radial burst at given screen coordinates (relative to canvas container).
 * Uses lightweight CSS animations; parent should remove it when onComplete fires.
 *
 * Props:
 * - x, y: pixel coordinates relative to the container
 * - size: base size in px
 * - duration: CSS time (e.g., '500ms')
 * - onComplete: callback when animation ends
 * - color: base color (defaults Ocean amber #F59E0B)
 */
// PUBLIC_INTERFACE
export default function Explosion({
  x = 0,
  y = 0,
  size = 80,
  duration = '520ms',
  color = '#F59E0B',
  onComplete,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handle = () => {
      onComplete && onComplete();
    };
    el.addEventListener('animationend', handle);
    return () => el.removeEventListener('animationend', handle);
  }, [onComplete]);

  const ringStyle = {
    position: 'absolute',
    left: x,
    top: y,
    width: size,
    height: size,
    marginLeft: -size / 2,
    marginTop: -size / 2,
    borderRadius: '50%',
    pointerEvents: 'none',
    background: `radial-gradient(closest-side, ${color}, rgba(245,158,11,0.0))`,
    boxShadow: `0 0 ${Math.round(size * 0.25)}px rgba(245,158,11,0.65)`,
    mixBlendMode: 'screen',
    animation: `explosion-burst ${duration} ease-out forwards`,
    willChange: 'transform, opacity',
  };

  const shards = Array.from({ length: 10 }).map((_, i) => {
    const ang = (i / 10) * Math.PI * 2;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    const shardLen = Math.round(size * 0.4 + (i % 3) * 4);
    return (
      <div
        key={i}
        className="shard"
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: 2,
          height: shardLen,
          marginLeft: -1,
          marginTop: -shardLen / 2,
          borderRadius: 2,
          background: color,
          boxShadow: `0 0 8px rgba(245,158,11,0.8)`,
          transform: `translate(0,0) rotate(${(ang * 180) / Math.PI}deg)`,
          transformOrigin: '50% 100%',
          opacity: 0.95,
          animation: `shard-fly ${duration} ease-out forwards`,
          '--dx': dx,
          '--dy': dy,
        }}
      />
    );
  });

  return (
    <>
      <div ref={ref} style={ringStyle} />
      {shards}
    </>
  );
}
