import { useCallback, useEffect, useState } from 'react';
import { supabase, supabaseAvailable } from '../lib/supabaseClient';

/**
 * PUBLIC_INTERFACE
 * useAuth
 * Hook that exposes Supabase auth state and actions, including Google OAuth.
 *
 * Returns:
 *  - user: current user or null
 *  - session: current session or null
 *  - loading: true while determining session
 *  - signInWithGoogle(): triggers Supabase OAuth with Google and redirects back to SPA origin
 *  - signOut(): signs out the current user
 *  - isConfigured: whether Supabase env vars are present (UI should disable sign-in if false)
 */
// PUBLIC_INTERFACE
export function useAuth() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured] = useState(Boolean(supabaseAvailable));

  useEffect(() => {
    let mounted = true;
    // Initialize from current session
    (async () => {
      if (!isConfigured) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        const s = data?.session ?? null;
        setSession(s);
        setUser(s?.user ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // Subscribe to auth changes
    const { data } = supabase.auth.onAuthStateChange((_event, _session) => {
      setSession(_session);
      setUser(_session?.user ?? null);
    });

    return () => {
      mounted = false;
      data?.subscription?.unsubscribe?.();
    };
  }, [isConfigured]);

  // PUBLIC_INTERFACE
  const signInWithGoogle = useCallback(async () => {
    /**
     * Triggers Google OAuth using Supabase Auth.
     * Uses redirectTo = window.location.origin for SPA return.
     */
    if (!isConfigured) {
      return { data: null, error: new Error('Supabase not configured') };
    }
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  }, [isConfigured]);

  // PUBLIC_INTERFACE
  const signOut = useCallback(async () => {
    /** Signs out the current user. */
    if (!isConfigured) return { error: null };
    return supabase.auth.signOut();
  }, [isConfigured]);

  return { user, session, loading, signInWithGoogle, signOut, isConfigured };
}
