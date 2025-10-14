import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * PUBLIC_INTERFACE
 * UserBadge
 * Shows a compact identity display (initial + name/email) and a Sign out button.
 * Uses Ocean Professional theme styles (btn) for consistency.
 */
// PUBLIC_INTERFACE
export default function UserBadge() {
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.display_name ||
    (user?.email ? String(user.email).split('@')[0] : 'Player');

  const initial = (displayName || 'U').trim().charAt(0).toUpperCase();

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <div
        aria-hidden
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'linear-gradient(180deg, #3B82F6, #2563EB)',
          color: '#fff',
          fontWeight: 800,
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
        }}
        title={user?.email || displayName}
      >
        {initial}
      </div>
      <div
        className="small"
        style={{
          color: 'var(--op-text)',
          fontWeight: 700,
          maxWidth: 180,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={user?.email || displayName}
      >
        {user?.email || displayName}
      </div>
      <button className="btn" onClick={handleSignOut} disabled={busy} aria-label="Sign out">
        {busy ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
}
