import React, { useMemo } from 'react';

/**
 * ThrusterEffect renders a small flame under the ship using pure CSS.
 * It uses keyframe flicker and glow that matches the Ocean theme accent (#F59E0B).
 *
 * Props:
 * - size: base size in px (default 14)
 * - intensity: 0..1 multiplier for opacity/blur (default 1)
 * - flickerSpeed: CSS duration string for flicker cycles (default '600ms')
 * - className: extra class
 * - style: inline style overrides
 */
// PUBLIC_INTERFACE
export default function ThrusterEffect({
  size = 14,
  intensity = 1,
  flickerSpeed = '600ms',
  className = '',
  style = {},
}) {
  const styles = useMemo(() => {
    const scale = Math.max(0.25, Math.min(1.75, intensity || 1));
    const shadowBlur = 10 * scale;
    const outerOpacity = 0.75 * scale;
    const innerOpacity = 0.95 * scale;

    return {
      wrap: {
        position: 'absolute',
        left: '50%',
        transform: 'translate(-50%, 0)',
        width: size,
        height: size * 1.8,
        pointerEvents: 'none',
        willChange: 'opacity, filter, transform',
        filter: `drop-shadow(0 0 ${shadowBlur}px rgba(245,158,11,0.7))`,
      },
      outer: {
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: size * 0.7,
        height: size * 1.4,
        background: 'radial-gradient(50% 100% at 50% 0%, rgba(245,158,11,0.75), rgba(245,158,11,0))',
        borderRadius: '50% 50% 60% 60% / 60% 60% 40% 40%',
        opacity: outerOpacity,
        animation: `thruster-flicker ${flickerSpeed} ease-in-out infinite`,
        mixBlendMode: 'screen',
      },
      inner: {
        position: 'absolute',
        bottom: size * 0.15,
        left: '50%',
        transform: 'translateX(-50%)',
        width: size * 0.38,
        height: size * 0.9,
        background: 'radial-gradient(50% 100% at 50% 0%, rgba(255,200,90,0.9), rgba(245,158,11,0))',
        borderRadius: '50% 50% 60% 60% / 60% 60% 40% 40%',
        opacity: innerOpacity,
        animation: `thruster-flicker ${flickerSpeed} ease-in-out infinite`,
        animationDelay: '100ms',
      },
    };
  }, [size, intensity, flickerSpeed]);

  return (
    <div className={`thruster-wrap ${className}`} style={{ ...styles.wrap, ...style }}>
      {/* Outer plume */}
      <div className="thruster-outer" style={styles.outer} />
      {/* Core flame */}
      <div className="thruster-inner" style={styles.inner} />
    </div>
  );
}
