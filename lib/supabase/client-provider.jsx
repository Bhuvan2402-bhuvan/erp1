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
        const res = await fetch('/api/auth/me').catch(() => null);
        if (res?.ok) {
          const { user: dbUser } = await res.json().catch(() => ({}));
          if (dbUser) {
            setUser({ email: dbUser.email, id: dbUser.supabaseUid || dbUser.id, ...dbUser });
            setLoading(false);
            return;
          }
        }
        setUser(session.user);
        setLoading(false);
        return;
      }

      // 2. Check /api/auth/me API endpoint
      const res = await fetch('/api/auth/me').catch(() => null);
      if (res?.ok) {
        const { user: dbUser } = await res.json().catch(() => ({}));
        if (dbUser) {
          setUser({ email: dbUser.email, id: dbUser.supabaseUid || dbUser.id, ...dbUser });
          setLoading(false);
          return;
        }
      }

      // 3. Client Cookie fallback
      if (typeof document !== 'undefined') {
        const cookies = Object.fromEntries(
          document.cookie.split('; ').filter(Boolean).map(c => {
            const [k, ...v] = c.split('=');
            return [k, v.join('=')];
          })
        );
        const email = cookies['x-user-email'] ? decodeURIComponent(cookies['x-user-email']) : '';
        const role = cookies['x-user-role'] || (email.includes('admin') ? 'ADMIN' : email.includes('faculty') ? 'FACULTY' : 'STUDENT');
        const id = cookies['x-user-id'] || (email ? 'usr-' + email.split('@')[0] : '');

        if (email || id || cookies['x-user-role']) {
          setUser({
            id: id || 'usr-session',
            email: email || 'user@erp.com',
            role,
            name: (email || 'USER').split('@')[0].toUpperCase(),
            approvalStatus: 'APPROVED'
          });
          setLoading(false);
          return;
        }
      }

      setUser(null);
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
