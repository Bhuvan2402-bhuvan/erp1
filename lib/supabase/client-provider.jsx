'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from './client';

const SupabaseContext = createContext(null);

export function SupabaseProvider({ children }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUser = useCallback(async () => {
    try {
      // First check if there's an active Supabase session locally
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // We have a Supabase session — verify against DB
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const { user: dbUser } = await res.json();
          if (dbUser) {
            setUser({ email: dbUser.email, id: dbUser.supabaseUid, ...dbUser });
            setLoading(false);
            return;
          }
        }
        // Supabase session exists but no DB record — use Supabase user
        setUser(session.user);
      } else {
        // No Supabase session, but check if server-side cookies exist (cookie-based login)
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
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

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

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
  };

  return (
    <SupabaseContext.Provider value={{ supabase, user, loading, signOut, refreshUser: checkUser }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within SupabaseProvider');
  return ctx;
}

// Backward compatibility hook alias
export const useFirebase = useSupabase;

