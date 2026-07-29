'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle';
import { useFirebase } from '@/lib/firebase/client-provider';

export default function LandingNavbar() {
  const { user, signOut } = useFirebase();

  const handleGoToDashboard = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const { user: dbUser } = await res.json();
        if (!dbUser) {
          window.location.href = '/login';
          return;
        }
        if (dbUser.isBlocked) window.location.href = '/login?error=account-blocked';
        else if (dbUser.approvalStatus === 'REJECTED') window.location.href = '/login?error=account-rejected';
        else if (dbUser.approvalStatus === 'PENDING') window.location.href = '/pending';
        else if (dbUser.role === 'ADMIN') window.location.href = '/admin/overview';
        else if (dbUser.role === 'FACULTY') window.location.href = '/faculty/branch';
        else window.location.href = '/student/events';
      } else {
        window.location.href = '/login';
      }
    } catch (e) {
      window.location.href = '/login';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 relative z-50 cursor-pointer">
          <Image src="/logo.png" alt="SAMP Logo" width={110} height={50} className="object-contain" priority />
        </a>

        <div className="flex items-center gap-3 sm:gap-4 relative z-50">
          <a
            href="/visitor"
            className="text-xs font-extrabold uppercase px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-logo-teal hover:border-logo-teal/50 transition border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            Visitor Directory
          </a>
          
          <ThemeToggle />

          {user ? (
            <button 
              type="button"
              onClick={handleGoToDashboard}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-logo-navy to-logo-teal rounded-full hover:opacity-90 transition-all duration-300 shadow-lg shadow-logo-teal/25 hover:shadow-logo-teal/40 hover:scale-[1.03] cursor-pointer"
            >
              Go to Dashboard
            </button>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <a 
                href="/login" 
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-logo-teal dark:hover:text-logo-teal transition-colors cursor-pointer"
              >
                Log In
              </a>
              <a 
                href="/signup" 
                className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-logo-navy to-logo-teal rounded-full hover:opacity-90 transition-all duration-300 shadow-lg shadow-logo-teal/25 hover:shadow-logo-teal/40 hover:scale-[1.03] cursor-pointer"
              >
                Sign Up
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
