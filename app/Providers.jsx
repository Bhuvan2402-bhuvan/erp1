'use client';
import { ThemeProvider } from 'next-themes';
import { SupabaseProvider } from '@/lib/supabase/client-provider';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

export default function Providers({ children }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (let registration of registrations) {
            registration.unregister();
          }
        }).catch(() => {});
      }
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (let key of keys) {
            caches.delete(key);
          }
        }).catch(() => {});
      }
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <SupabaseProvider>
        <Toaster position="top-right" />
        {children}
      </SupabaseProvider>
    </ThemeProvider>
  );
}
