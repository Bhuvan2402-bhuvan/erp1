'use client';
import { createContext, useContext, useMemo } from 'react';
import { createClient } from './client';

const SupabaseContext = createContext(null);

export function SupabaseProvider({ children }) {
  const supabase = useMemo(() => createClient(), []);
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within SupabaseProvider');
  return ctx;
}
