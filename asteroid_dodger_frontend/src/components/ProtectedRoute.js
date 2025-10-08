import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

/**
 * ProtectedRoute wraps children and redirects unauthenticated users to /auth.
 */
// PUBLIC_INTERFACE
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="ocean-main">
        <div className="game-card" style={{ marginTop: 24 }}>
          <div className="small">Loading session…</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
