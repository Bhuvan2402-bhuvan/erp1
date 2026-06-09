'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle';
import { useSupabase } from '@/lib/supabase/client-provider';

/**
 * Shared post-login routing logic.
 * Determines where to send the user based on their dbUser record.
 */
function resolvePostLoginRoute(dbUser) {
  if (dbUser.isBlocked) return { error: 'Your account has been blocked.' };
  if (dbUser.approvalStatus === 'REJECTED') return { error: 'Your account was rejected.' };

  if (dbUser.role !== 'ADMIN' && (
    (dbUser.role === 'FACULTY' && !dbUser.faculty) ||
    (dbUser.role === 'STUDENT' && !dbUser.student)
  )) {
    return { redirect: '/onboarding' };
  }

  if (dbUser.approvalStatus === 'PENDING') return { redirect: '/pending' };

  if (dbUser.role === 'ADMIN') return { redirect: '/admin/overview' };
  if (dbUser.role === 'FACULTY') return { redirect: '/faculty/branch' };
  return { redirect: '/student/events' };
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  const supabase = useSupabase();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const { user: dbUser } = await res.json();
            const result = resolvePostLoginRoute(dbUser);
            if (result.error) {
              await supabase.auth.signOut();
              setError(result.error);
            } else {
              router.push(result.redirect);
            }
          } else if (res.status === 404) {
            router.push('/onboarding');
          }
        } catch (err) {
          console.error('Auto-login database verification failed:', err);
        }
      }
    });
  }, [router, supabase]);

  useEffect(() => {
    if (urlError === 'auth-callback-failed') {
      setError('An error occurred during authentication callback.');
    } else if (urlError) {
      setError('An error occurred during authentication.');
    }
  }, [urlError]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError('Please verify your email address before logging in. Check your inbox (and spam folder) for the verification link.');
        } else {
          setError(error.message);
        }
      } else {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
           const { user: dbUser } = await res.json();
           const result = resolvePostLoginRoute(dbUser);
           if (result.error) {
             await supabase.auth.signOut();
             setError(result.error);
             setLoading(false);
             return;
           }
           router.push(result.redirect);
        } else {
           router.push('/');
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image src="/logo.png" alt="Portal Logo" width={140} height={64} className="object-contain" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          Sign in to Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Or <Link href="/signup" className="font-medium text-logo-teal hover:text-logo-navy">create a new account</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100 dark:border-slate-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
              <div className="mt-1">
                <input name="email" type="email" required value={formData.email} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-logo-teal focus:border-logo-teal sm:text-sm dark:bg-slate-700 dark:text-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <div className="mt-1">
                <input name="password" type="password" required value={formData.password} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-logo-teal focus:border-logo-teal sm:text-sm dark:bg-slate-700 dark:text-white" />
              </div>
            </div>

            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-logo-navy to-logo-teal hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-logo-teal disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300 dark:border-slate-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    <path fill="none" d="M1 1h22v22H1z" />
                  </svg>
                  Google
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function Login() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Suspense fallback={<div className="text-center text-slate-500">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
