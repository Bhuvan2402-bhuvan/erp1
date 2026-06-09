'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Users, Star, Sparkles, Zap, Award } from 'lucide-react';
import { useSupabase } from '@/lib/supabase/client-provider';

export default function LandingHero({ stats }) {
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const supabase = useSupabase();
  const { scrollYProgress } = useScroll();

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -150]);

  useEffect(() => {
    setMounted(true);
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

  const floatIconVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <section className="relative flex items-center pt-16 pb-24 lg:py-32 z-10">
      {/* Soft Glowing Ambient Orbs */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-logo-teal/20 dark:bg-logo-teal/10 blur-[80px] transform-gpu pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-0 w-[600px] h-[600px] rounded-full bg-logo-green/20 dark:bg-logo-green/10 blur-[90px] transform-gpu pointer-events-none -z-10" />

      {/* Decorative parallax background nodes */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
          <motion.div style={{ y: y1 }} className="absolute top-16 left-[8%]">
            <motion.div variants={floatIconVariants} animate="animate" className="p-4 bg-white/95 dark:bg-slate-800/90 rounded-2xl shadow-md border border-slate-200/40 dark:border-slate-700/40">
              <Star className="w-6 h-6 text-logo-amber fill-logo-amber" />
            </motion.div>
          </motion.div>
          <motion.div style={{ y: y2 }} className="absolute bottom-24 right-[12%]">
            <motion.div variants={floatIconVariants} animate="animate" className="p-4 bg-white/95 dark:bg-slate-800/90 rounded-2xl shadow-md border border-slate-200/40 dark:border-slate-700/40" style={{ animationDelay: '0.8s' }}>
              <Sparkles className="w-6 h-6 text-logo-teal" />
            </motion.div>
          </motion.div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid lg:grid-cols-12 gap-16 items-center">
        {/* Hero Left Content */}
        <div className="lg:col-span-7 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-logo-teal/10 dark:bg-logo-teal/20 border border-logo-teal/20 dark:border-logo-teal/35 text-logo-teal dark:text-logo-teal text-xs font-bold mb-6 tracking-wide uppercase shadow-sm">
              <Zap className="w-3.5 h-3.5 text-logo-amber fill-logo-amber animate-pulse" /> Student Attendance Management Portal
            </span>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
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
              Welcome to the official Student Attendance Management Portal. We provide student leaders and administrators with tools to coordinate events, manage attendance, track hours, and generate portfolios.
            </p>
            
            {user ? (
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button 
                  onClick={handleGoToDashboard} 
                  className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-logo-navy to-logo-teal text-white font-bold rounded-full shadow-xl shadow-logo-teal/25 hover:shadow-logo-teal/40 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setUser(null);
                    router.refresh();
                  }} 
                  className="w-full sm:w-auto px-6 py-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-200 font-bold rounded-full border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:scale-[1.02] transition-all duration-300 text-center shadow-md"
                >
                  Sign Out
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium sm:ml-2">
                  Logged in as <strong className="text-logo-teal">{user.email}</strong>
                </span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/signup" className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-logo-navy to-logo-teal text-white font-bold rounded-full shadow-xl shadow-logo-teal/25 hover:shadow-logo-teal/40 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2">
                  Join as Volunteer
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="flex w-full sm:w-auto gap-2">
                  <Link href="/login?role=student" className="w-full sm:w-auto px-6 py-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-200 font-bold rounded-full border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:scale-[1.02] transition-all duration-300 text-center shadow-md">
                    Student Login
                  </Link>
                  <Link href="/login?role=coordinator" className="w-full sm:w-auto px-6 py-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-200 font-bold rounded-full border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:scale-[1.02] transition-all duration-300 text-center shadow-md">
                    Coordinator Login
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Hero Right Visuals: Interactive Dashboard Teaser */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-logo-navy to-logo-teal rounded-[2.5rem] opacity-20 blur-lg transform-gpu -z-10" />
            
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xl rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-logo-teal/10">
              {/* Visual Header */}
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

              {/* Progress bar widget */}
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

                {/* Activity List */}
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

                {/* Stat boxes */}
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}
