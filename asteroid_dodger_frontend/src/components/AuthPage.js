import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider';

/**
 * AuthPage: Simple email/password sign in / sign up form.
 * Ocean Professional styling via existing CSS tokens.
 */
// PUBLIC_INTERFACE
export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) setMessage({ type: 'error', text: error.message });
        else setMessage({ type: 'success', text: 'Signed in!' });
      } else {
        const { error } = await signUp(email, password);
        if (error) setMessage({ type: 'error', text: error.message });
        else setMessage({ type: 'success', text: 'Account created. You can now sign in.' });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ocean-main" style={{ maxWidth: 520 }}>
      <div className="game-card" style={{ marginTop: 24 }}>
        <h2 style={{ margin: 0, color: 'var(--op-primary)' }}>
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h2>
        <p className="small" style={{ marginTop: 4 }}>
          {mode === 'signin'
            ? 'Sign in with your email to play and track your best score.'
            : 'Sign up to save your best score and join the leaderboard.'}
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="small" style={{ color: 'var(--op-muted)' }}>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="op-input"
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="small" style={{ color: 'var(--op-muted)' }}>Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="op-input"
            />
          </label>

          {message && (
            <div
              role="alert"
              style={{
                marginTop: 4,
                padding: '8px 10px',
                borderRadius: 10,
                border: '1px solid rgba(17,24,39,0.12)',
                background:
                  message.type === 'error'
                    ? 'rgba(239,68,68,0.08)'
                    : 'rgba(37,99,235,0.08)',
                color: message.type === 'error' ? '#991B1B' : '#1E3A8A',
              }}
            >
              {message.text}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
            >
              {mode === 'signin' ? 'Create an account' : 'Have an account? Sign in'}
            </button>
          </div>
        </form>

        <div className="small" style={{ marginTop: 12, color: 'var(--op-muted)' }}>
          Note: Email/password auth powered by Supabase.
        </div>
      </div>
    </div>
  );
}
