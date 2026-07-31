'use client';
import { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Users, Zap, Award } from 'lucide-react';
import { useSupabase } from '@/lib/supabase/client-provider';

export default function LandingHero({ stats }) {
  const { user, signOut } = useSupabase();

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
    <section className="relative flex items-center pt-12 pb-20 lg:py-28 z-20">
      {/* Ambient Orbs Background */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-logo-teal/15 dark:bg-logo-teal/10 blur-[80px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-0 w-[600px] h-[600px] rounded-full bg-logo-green/15 dark:bg-logo-green/10 blur-[90px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid lg:grid-cols-12 gap-12 items-center relative z-20">
        {/* Hero Left Content */}
        <div className="lg:col-span-7 text-center lg:text-left relative z-30">
          <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-logo-teal/10 dark:bg-logo-teal/20 border border-logo-teal/20 dark:border-logo-teal/35 text-logo-teal dark:text-logo-teal text-xs font-bold mb-6 tracking-wide uppercase shadow-sm">
            <Zap className="w-3.5 h-3.5 text-logo-amber fill-logo-amber animate-pulse" /> VVITU NSS ERP
          </span>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-slate-900 dark:text-white">
            Not Me, But You.<br />
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-logo-navy via-logo-teal to-logo-green dark:from-logo-navy dark:via-logo-teal dark:to-logo-green">
                Empowering Community
              </span>
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-logo-teal/40 dark:text-logo-teal/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" fill="transparent" stroke="currentColor" strokeWidth="3" />
              </svg>
            </span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Welcome to the official VVITU NSS ERP portal. We provide student leaders and administrators with tools to coordinate events, manage attendance, track hours, and generate portfolios.
          </p>
          
          {user ? (
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 relative z-30">
              <button 
                type="button"
                onClick={handleGoToDashboard} 
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-logo-navy to-logo-teal text-white font-bold rounded-full shadow-xl shadow-logo-teal/25 hover:shadow-logo-teal/40 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer relative z-30"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                type="button"
                onClick={async () => {
                  await signOut();
                  window.location.reload();
                }} 
                className="w-full sm:w-auto px-6 py-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-200 font-bold rounded-full border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:scale-[1.02] transition-all duration-300 text-center shadow-md cursor-pointer relative z-30"
              >
                Sign Out
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium sm:ml-2">
                Logged in as <strong className="text-logo-teal">{user.email}</strong>
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center lg:items-start gap-4 relative z-30">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 w-full relative z-30">
                <a 
                  href="/signup" 
                  className="group px-7 py-3.5 bg-gradient-to-r from-logo-navy to-logo-teal text-white font-bold rounded-full shadow-lg shadow-logo-teal/25 hover:shadow-logo-teal/40 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 text-sm cursor-pointer relative z-30"
                >
                  Join as Volunteer
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <a 
                  href="/login?role=student" 
                  className="px-5 py-3.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-slate-700 dark:text-slate-200 text-sm font-bold rounded-full border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-[1.02] transition-all duration-300 text-center shadow-sm cursor-pointer relative z-30"
                >
                  🤝 Volunteer Login
                </a>
                <a 
                  href="/login?role=coordinator" 
                  className="px-5 py-3.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-slate-700 dark:text-slate-200 text-sm font-bold rounded-full border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-[1.02] transition-all duration-300 text-center shadow-sm cursor-pointer relative z-30"
                >
                  ⭐ Coordinator Login
                </a>
                <a 
                  href="/login?role=faculty" 
                  className="px-5 py-3.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-slate-700 dark:text-slate-200 text-sm font-bold rounded-full border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-[1.02] transition-all duration-300 text-center shadow-sm cursor-pointer relative z-30"
                >
                  🎓 Faculty Login
                </a>
                <a 
                  href="/login?role=admin" 
                  className="px-5 py-3.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-slate-700 dark:text-slate-200 text-sm font-bold rounded-full border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-[1.02] transition-all duration-300 text-center shadow-sm cursor-pointer relative z-30"
                >
                  👑 Admin Login
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Hero Right Visuals */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none relative z-20">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-logo-navy to-logo-teal rounded-[2.5rem] opacity-20 blur-lg transform-gpu -z-10" />
            
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xl rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-logo-teal/10">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-logo-green animate-ping" /> Live Campaign Activity
                </span>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Blood Drive registration</span>
                    <span className="text-xs font-extrabold text-logo-navy dark:text-logo-teal">124 / 150 Target</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-500 to-red-500 h-full rounded-full w-[82.6%]" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-xl transition">
                    <div className="p-2 rounded-lg bg-logo-green/10 dark:bg-logo-green/20 text-logo-green shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Arun K. (Student) joined</p>
                      <p className="text-[10px] text-slate-500">Registered for Plantation Drive • 2 mins ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-xl transition">
                    <div className="p-2 rounded-lg bg-logo-teal/10 dark:bg-logo-teal/20 text-logo-teal shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Hour Audits Completed</p>
                      <p className="text-[10px] text-slate-500">Dr. Srinivasan approved 12 certificates • 1 hour ago</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="p-3 bg-logo-teal/5 dark:bg-logo-teal/10 border border-logo-teal/20 dark:border-logo-teal/10 rounded-xl text-center">
                    <p className="text-lg font-extrabold text-logo-teal">{stats.totalEvents}+</p>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Completed Campaigns</p>
                  </div>
                  <div className="p-3 bg-logo-navy/5 dark:bg-logo-navy/10 border border-logo-navy/20 dark:border-logo-navy/10 rounded-xl text-center">
                    <p className="text-lg font-extrabold text-logo-navy dark:text-logo-teal">
                      {stats.totalHours >= 1000 ? `${Math.round(stats.totalHours / 1000)}k+` : `${stats.totalHours}+`}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Service Hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
