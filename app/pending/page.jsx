'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase/client-provider';
import ThemeToggle from '@/components/ThemeToggle';

export default function PendingApproval() {
  const router = useRouter();
  const { user, loading, signOut } = useSupabase();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Account Pending</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Your account has been created but is waiting for an administrator to approve it. 
          Please check back later or contact your department head.
        </p>
        <button 
          onClick={async () => {
            await signOut();
            window.location.href = '/login';
          }}
          className="bg-gradient-to-r from-logo-navy to-logo-teal hover:opacity-90 text-white px-6 py-2.5 rounded-full font-medium transition shadow-sm"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
}
