'use client';
import { ThemeProvider } from 'next-themes';
import { FirebaseProvider } from '@/lib/firebase/client-provider';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

export default function Providers({ children }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('Service worker registered: ', reg.scope))
          .catch((err) => console.error('Service worker registration failed: ', err));
      } else {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (let registration of registrations) {
            registration.unregister();
            console.log('Service worker unregistered in development mode');
          }
        });
      }
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <FirebaseProvider>
        <Toaster position="top-right" />
        {children}
      </FirebaseProvider>
    </ThemeProvider>
  );
}
