'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';
import { useSupabase } from '@/lib/supabase/client-provider';

export default function LandingNavbar() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const supabase = useSupabase();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, [supabase]);

  const handleGoToDashboard = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const { user: dbUser } = await res.json();
        if (dbUser.isBlocked) router.push('/login?error=account-blocked');
        else if (dbUser.approvalStatus === 'REJECTED') router.push('/login?error=account-rejected');
        else if (dbUser.approvalStatus === 'PENDING') router.push('/pending');
        else if (dbUser.role === 'ADMIN') router.push('/admin/overview');
        else if (dbUser.role === 'FACULTY') router.push('/faculty/branch');
        else router.push('/student/events');
      } else {
        router.push('/login');
      }
    } catch (e) {
      router.push('/login');
    }
  };

  return (
    <nav className="border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center"
        >
          <Link href="/">
            <Image src="/logo.png" alt="SAMP Logo" width={110} height={50} className="object-contain" priority />
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <ThemeToggle />
          {user ? (
            <button 
              onClick={handleGoToDashboard}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-logo-navy to-logo-teal rounded-full hover:opacity-90 transition-all duration-300 shadow-lg shadow-logo-teal/25 hover:shadow-logo-teal/40 hover:scale-[1.03]"
            >
              Go to Dashboard
            </button>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/login" className="text-sm font-semibold hover:text-logo-teal dark:hover:text-logo-teal transition-colors">Log In</Link>
              <Link href="/signup" className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-logo-navy to-logo-teal rounded-full hover:opacity-90 transition-all duration-300 shadow-lg shadow-logo-teal/25 hover:shadow-logo-teal/40 hover:scale-[1.03]">Sign Up</Link>
            </div>
          )}
        </motion.div>
      </div>
    </nav>
  );
}
