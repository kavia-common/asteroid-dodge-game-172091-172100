import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * PUBLIC_INTERFACE
 * AuthButton
 * Renders a Google OAuth sign-in button when the user is signed out.
 * - Calls supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin }})
 * - Disables the button with a helpful message if Supabase is not configured.
 */
// PUBLIC_INTERFACE
export default function AuthButton() {
  const { user, loading, signInWithGoogle, isConfigured } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  if (user) return null;

  const disabled = !isConfigured || loading || busy;

  const handleClick = async () => {
    setErr(null);
    setBusy(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) setErr(error.message || String(error));
      // On success, Supabase will redirect to Google; upon return, session is restored.
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      // If redirected away, this won't run until back; harmless safeguard.
      setBusy(false);
    }
  };

  const title = !isConfigured
    ? 'Supabase environment variables are missing. Provide REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.'
    : busy
    ? 'Redirecting to Google…'
    : 'Sign in with Google via Supabase';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <button
        className="btn btn-primary"
        onClick={handleClick}
        disabled={disabled}
        title={title}
        aria-disabled={disabled}
        aria-label="Continue with Google"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-grid',
            placeItems: 'center',
            width: 20,
            height: 20,
            borderRadius: 4,
            background: '#fff',
            color: '#111827',
            fontWeight: 800,
            fontSize: 12,
          }}
        >
          G
        </span>
        {busy ? 'Redirecting…' : 'Continue with Google'}
      </button>
      {!isConfigured && (
        <span className="small" style={{ marginTop: 6, maxWidth: 280, textAlign: 'right' }}>
          Supabase not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.
        </span>
      )}
      {err && (
        <span
          role="alert"
          className="small"
          style={{
            marginTop: 6,
            color: '#991B1B',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(17,24,39,0.12)',
            padding: '6px 8px',
            borderRadius: 8,
          }}
        >
          {err}
        </span>
      )}
    </div>
  );
}
