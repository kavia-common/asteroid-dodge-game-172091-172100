import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Leaderboard shows top 10 scores from 'scores' table.
 * Each row: rank, user identifier (email prefix), score.
 */
// PUBLIC_INTERFACE
export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('scores')
          .select('user_id, email, best_score, updated_at')
          .order('best_score', { ascending: false })
          .limit(10);
        if (!mounted) return;
        if (err) {
          setError(err.message);
        } else {
          setRows(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (mounted) setError(e?.message || 'Failed to load leaderboard.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="ocean-main" style={{ maxWidth: 720 }}>
      <div className="game-card" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, color: 'var(--op-primary)' }}>Leaderboard</h2>
          <span className="small" style={{ color: 'var(--op-muted)' }}>
            Top 10 best scores
          </span>
        </div>

        {loading && <div className="small" style={{ marginTop: 8 }}>Loading…</div>}
        {error && (
          <div
            role="alert"
            style={{
              marginTop: 8,
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid rgba(17,24,39,0.12)',
              background: 'rgba(239,68,68,0.08)',
              color: '#991B1B',
            }}
          >
            {error}
            <div className="small" style={{ marginTop: 6, color: 'var(--op-muted)' }}>
              If this is a fresh setup, ensure the Supabase schema is created. See README for SQL.
            </div>
          </div>
        )}

        {!loading && !error && (
          <div style={{ marginTop: 12 }}>
            {rows.length === 0 ? (
              <div className="small" style={{ color: 'var(--op-muted)' }}>
                No scores yet. Be the first to play!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="op-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      <th style={thS}>#</th>
                      <th style={thS}>Player</th>
                      <th style={thS}>Best Score</th>
                      <th style={thS}>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => {
                      const name = r.email ? String(r.email).split('@')[0] : (r.user_id || 'anon');
                      return (
                        <tr key={`${r.user_id}-${idx}`} style={{ background: idx % 2 ? 'rgba(37,99,235,0.03)' : 'transparent' }}>
                          <td style={tdS}>{idx + 1}</td>
                          <td style={tdS}>{name}</td>
                          <td style={{ ...tdS, fontWeight: 800, color: 'var(--op-primary)' }}>{r.best_score}</td>
                          <td style={{ ...tdS, color: 'var(--op-muted)', fontSize: 12 }}>
                            {r.updated_at ? new Date(r.updated_at).toLocaleString() : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const thS = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid rgba(17,24,39,0.12)',
  fontSize: 12,
  color: 'var(--op-muted)',
  fontWeight: 700,
};

const tdS = {
  padding: '10px 12px',
  borderBottom: '1px solid rgba(17,24,39,0.06)',
};
