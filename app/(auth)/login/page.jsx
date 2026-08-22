'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle';
import { useSupabase } from '@/lib/supabase/client-provider';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Shield, CheckCircle2, UserCheck, ShieldAlert } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  const { supabase, user, loading: authLoading, refreshUser } = useSupabase();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Parse URL errors
  useEffect(() => {
    if (urlError === 'auth-callback-failed') {
      setError('An error occurred during authentication callback.');
    } else if (urlError === 'account-blocked') {
      setError('Your account has been blocked. Please contact an administrator.');
    } else if (urlError === 'account-rejected') {
      setError('Your account registration was rejected.');
    } else if (urlError === 'account-pending') {
      setError('Your account is pending approval by an administrator.');
    } else if (urlError === 'unauthorized') {
      setError('Please sign in to access this page.');
    } else if (urlError) {
      setError('An error occurred during authentication.');
    }
  }, [urlError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.email || !formData.email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!formData.password || !formData.password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Optional Supabase auth client sync
      if (supabase?.auth) {
        try {
          await supabase.auth.signInWithPassword({
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
          });
        } catch (sbErr) {
          // Ignore Supabase auth error fallback to session API
        }
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      if (refreshUser) {
        await refreshUser().catch(() => null);
      }

      const targetUrl = data.redirect || '/student/events';
      window.location.replace(targetUrl);
    } catch (err) {
      setError('Network connection error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      if (!supabase?.auth) {
        setError('Google sign-in is currently unavailable.');
        return;
      }
      const { error: authErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/api/auth/callback` }
      });
      if (authErr) throw authErr;
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    }
  };

  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <Image src="/vvit-logo.jpg" alt="VVIT Logo" width={90} height={45} className="h-10 w-auto object-contain rounded" />
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
            <Image src="/nss-logo.png" alt="NSS Logo" width={110} height={45} className="h-10 w-auto object-contain" />
          </div>
          <span className="text-xl font-extrabold text-slate-800 dark:text-white tracking-wide">
            VVITU NSS ERP
          </span>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 dark:text-white">
          Sign in to Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Or <Link href="/signup" className="font-semibold text-logo-teal hover:text-logo-navy transition-colors">create a new account</Link>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-lg sm:rounded-2xl sm:px-10 border border-slate-100 dark:border-slate-700/80">
          
          <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="e.g. admin1@erp.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-logo-teal focus:border-logo-teal text-sm dark:bg-slate-700 dark:text-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-9 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-logo-teal focus:border-logo-teal text-sm dark:bg-slate-700 dark:text-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-logo-navy to-logo-teal hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-logo-teal disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 font-medium">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition cursor-pointer"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <Suspense fallback={<div className="text-center text-slate-500 font-medium py-10">Loading portal login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

