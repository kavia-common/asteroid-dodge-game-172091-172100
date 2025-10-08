import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * AuthContext provides:
 * - user: Supabase user object or null
 * - session: Supabase session or null
 * - loading: boolean while determining session
 * - signIn, signUp, signOut: email/password methods
 */

// PUBLIC_INTERFACE
export const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  // PUBLIC_INTERFACE
  signIn: async (_email, _password) => ({ error: null }),
  // PUBLIC_INTERFACE
  signUp: async (_email, _password) => ({ error: null }),
  // PUBLIC_INTERFACE
  signOut: async () => ({ error: null }),
});

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access AuthContext. */
  return useContext(AuthContext);
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides Supabase auth session state and actions to the app. */
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial session fetch and auth state change subscription
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session || null);
      setUser(data.session?.user || null);
      setLoading(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      setSession(_session);
      setUser(_session?.user || null);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email, password) => {
    // emailRedirectTo optional; would require SITE_URL env. Not provided here.
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = { user, session, loading, signIn, signUp, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
