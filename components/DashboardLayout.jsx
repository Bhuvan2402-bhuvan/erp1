'use client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LogOut, Menu, X, Download,
  LayoutDashboard, Users, Calendar, AlertTriangle, MessageSquare, Megaphone,
  GraduationCap, BookOpen, UserCircle, FolderOpen, ClipboardList, Award, UserCheck
} from 'lucide-react';
import { useSupabase } from '@/lib/supabase/client-provider';
import ThemeToggle from '@/components/ThemeToggle';
import { useState, useEffect } from 'react';

const iconMap = {
  LayoutDashboard, Users, Calendar, AlertTriangle, MessageSquare, Megaphone,
  GraduationCap, BookOpen, UserCircle, FolderOpen, ClipboardList, Award, UserCheck
};

export default function DashboardLayout({ dbUser, tabs, title, subtitle, badge, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useSupabase();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handlePrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const initials = dbUser?.name
    ? dbUser.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const NavItems = () => (
    <div className="space-y-1">
      {tabs.map(tab => {
        const Icon = iconMap[tab.icon] || FolderOpen;
        const isActive = pathname.startsWith(tab.href) || (pathname === tab.basePath && tab.href === tab.basePath);
        return (
          <Link
            key={tab.id}
            href={tab.href}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-gradient-to-r from-logo-navy/10 to-logo-teal/10 dark:from-logo-navy/20 dark:to-logo-teal/20 border-l-4 border-logo-teal text-logo-navy dark:text-logo-teal font-bold'
                : 'border-l-4 border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{tab.name}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex relative overflow-x-hidden">
      {/* Decorative Grid Overlay & Background Glowing Orbs */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none z-0" />
      <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-logo-teal/10 dark:bg-logo-teal/5 blur-[80px] transform-gpu pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] rounded-full bg-logo-green/10 dark:bg-logo-green/5 blur-[90px] transform-gpu pointer-events-none -z-10" />

      {/* Desktop Sidebar (visible on md+) */}
      <aside className="hidden md:flex w-72 border-r border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex-col justify-between sticky top-0 h-screen z-20 shrink-0">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-center">
            <Image src="/logo.png" alt="SAMP Logo" width={160} height={72} className="object-contain" />
          </div>

          {/* User Profile Info */}
          <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="flex items-center gap-3">
              {dbUser?.avatarUrl ? (
                <Image src={dbUser.avatarUrl} alt={dbUser.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover shadow-sm" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-logo-navy to-logo-teal text-white font-bold flex items-center justify-center text-sm">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{dbUser?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{dbUser?.email}</p>
              </div>
            </div>
            {badge && (
              <div className="mt-2.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase w-fit">
                {badge}
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
            <NavItems />
          </nav>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 space-y-2">
          {deferredPrompt && (
            <button
              onClick={handleInstallApp}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-logo-navy hover:opacity-90 rounded-xl transition shadow-md"
            >
              <Download className="w-4 h-4 animate-bounce" /> Install Desktop App
            </button>
          )}
          <div className="flex items-center justify-between gap-3">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Drawer Menu */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 md:hidden flex flex-col justify-between transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <Image src="/logo.png" alt="SAMP Logo" width={120} height={54} className="object-contain" />
            <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-logo-navy to-logo-teal text-white font-bold flex items-center justify-center text-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{dbUser?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{dbUser?.email}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <NavItems />
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {deferredPrompt && (
            <button
              onClick={handleInstallApp}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-logo-navy hover:opacity-90 rounded-xl transition shadow-md"
            >
              <Download className="w-4 h-4 animate-bounce" /> Install App
            </button>
          )}
          <div className="flex items-center justify-between gap-3">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Mobile Header Bar */}
        <header className="md:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-base font-bold text-slate-800 dark:text-white truncate">
              {title}
            </span>
          </div>
          <Image src="/logo.png" alt="SAMP Logo" width={72} height={32} className="object-contain shadow-sm" />
        </header>

        {/* Dashboard Title Section (Desktop only, as title is inside header on mobile) */}
        <div className="hidden md:block px-8 pt-8 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <main className="p-4 sm:p-8 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
