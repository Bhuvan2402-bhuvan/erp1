'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from './client';

const SupabaseContext = createContext(null);

export function SupabaseProvider({ children }) {
  const [supabase] = useState(() => createClient());
  const [user,     setUser]    = useState(null);
  const [loading,  setLoading] = useState(true);

  // ─── getAccessToken ─────────────────────────────────────────────────────────
  /**
   * Returns the current Supabase JWT access token, or null if not signed in.
   * Use this to attach `Authorization: Bearer <token>` when calling the
   * Render Express backend.
   *
   * @returns {Promise<string|null>}
   */
  const getAccessToken = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    } catch {
      return null;
    }
  }, [supabase]);

  // ─── checkUser ──────────────────────────────────────────────────────────────
  const checkUser = useCallback(async () => {
    try {
      // 1. Check active Supabase session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Verify against our DB and enrich with role/approval status
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const { user: dbUser } = await res.json();
          if (dbUser) {
            setUser({ email: dbUser.email, id: dbUser.supabaseUid, ...dbUser });
            setLoading(false);
            return;
          }
        }
        // Supabase session exists but no DB record yet — use raw Supabase user
        setUser(session.user);
      } else {
        // 2. No Supabase session — check server-side cookies (legacy login path)
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const { user: dbUser } = await res.json();
          if (dbUser) {
            setUser({ email: dbUser.email, id: dbUser.supabaseUid, ...dbUser });
            setLoading(false);
            return;
          }
        }
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // ─── Auth state listener ─────────────────────────────────────────────────────
  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, checkUser]);

  // ─── signOut ────────────────────────────────────────────────────────────────
  const signOut = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    setUser(null);
  };

  return (
    <SupabaseContext.Provider value={{ supabase, user, loading, signOut, refreshUser: checkUser, getAccessToken }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within <SupabaseProvider>');
  return ctx;
}

// Backward-compat alias kept for any component that still imports useFirebase
export const useFirebase = useSupabase;
