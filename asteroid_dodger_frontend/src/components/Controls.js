import React from 'react';

/**
 * Controls presents keyboard instructions and brief tips.
 */
// PUBLIC_INTERFACE
export default function Controls() {
  return (
    <div>
      <h2 style={{ marginTop: 4, marginBottom: 12, fontSize: 16 }}>How to Play</h2>
      <div className="controls">
        <div className="control-card">
          <div style={{ marginBottom: 8, fontWeight: 700, color: 'var(--op-primary)' }}>Movement</div>
          <div><span className="kbd">←</span> <span className="kbd">→</span> or <span className="kbd">A</span> <span className="kbd">D</span></div>
        </div>
        <div className="control-card">
          <div style={{ marginBottom: 8, fontWeight: 700, color: 'var(--op-secondary)' }}>Goal</div>
          <div>Dodge falling asteroids and survive as long as possible.</div>
        </div>
        <div className="control-card">
          <div style={{ marginBottom: 8, fontWeight: 700, color: 'var(--op-primary)' }}>Difficulty</div>
          <div>Asteroids fall faster and spawn more often over time.</div>
        </div>
      </div>
    </div>
  );
}
