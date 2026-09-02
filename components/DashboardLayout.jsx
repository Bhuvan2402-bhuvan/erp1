'use client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LogOut, Menu, X, Download, MapPin, TrendingUp,
  LayoutDashboard, Users, Calendar, AlertTriangle, MessageSquare, Megaphone,
  GraduationCap, BookOpen, UserCircle, FolderOpen, ClipboardList, Award, UserCheck, Quote, Activity,
  FileText, ClipboardCheck, PlusCircle, Inbox, CheckSquare, Send, ChevronRight
} from 'lucide-react';
import { useSupabase } from '@/lib/supabase/client-provider';
import ThemeToggle from '@/components/ThemeToggle';
import { useState, useEffect } from 'react';

const iconMap = {
  LayoutDashboard, Users, Calendar, AlertTriangle, MessageSquare, Megaphone,
  GraduationCap, BookOpen, UserCircle, FolderOpen, ClipboardList, Award, UserCheck, Quote, Activity,
  FileText, ClipboardCheck, PlusCircle, Inbox, CheckSquare, Send, ChevronRight, Download, MapPin, TrendingUp
};

export default function DashboardLayout({ dbUser, tabs, title, subtitle, badge, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useSupabase();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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
    await signOut();
    window.location.href = '/login';
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
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex overflow-hidden relative">
      {/* Decorative Grid Overlay & Background Glowing Orbs */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none z-0" />
      <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-logo-teal/10 dark:bg-logo-teal/5 blur-[80px] transform-gpu pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] rounded-full bg-logo-green/10 dark:bg-logo-green/5 blur-[90px] transform-gpu pointer-events-none -z-10" />

      {/* Desktop Sidebar (visible on md+) — stays permanently fixed and still */}
      <aside className="hidden md:flex w-72 h-screen border-r border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex-col justify-between shrink-0 z-20">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex flex-col items-center gap-2 text-center shrink-0">
            <div className="flex items-center justify-center gap-2">
              <Image src="/vvit-logo.jpg" alt="VVIT Logo" width={80} height={40} className="h-10 w-auto object-contain rounded" />
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
              <Image src="/nss-logo.png" alt="NSS Logo" width={100} height={40} className="h-10 w-auto object-contain" />
            </div>
            <span className="font-extrabold text-sm text-slate-800 dark:text-white tracking-wide">
              VVITU NSS ERP
            </span>
          </div>

          {/* User Profile Info */}
          <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
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

          {/* Navigation Items — scrolls independently if tabs exceed height */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
            <NavItems />
          </nav>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 space-y-2 shrink-0">
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
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Image src="/vvit-logo.jpg" alt="VVIT Logo" width={60} height={30} className="h-8 w-auto object-contain rounded" />
              <div className="h-5 w-px bg-slate-300 dark:bg-slate-700" />
              <Image src="/nss-logo.png" alt="NSS Logo" width={80} height={30} className="h-8 w-auto object-contain" />
              <span className="font-extrabold text-sm text-slate-800 dark:text-white">
                VVITU NSS ERP
              </span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 shrink-0">
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

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
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

      {/* Main Panel Wrapper (Independent Scroll Container) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative z-10">
        {/* Mobile Header Bar */}
        <header className="md:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shrink-0">
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
          <div className="flex items-center gap-1.5 shrink-0">
            <Image src="/vvit-logo.jpg" alt="VVIT Logo" width={50} height={25} className="h-6 w-auto object-contain rounded" />
            <Image src="/nss-logo.png" alt="NSS Logo" width={60} height={25} className="h-6 w-auto object-contain" />
          </div>
        </header>

        {/* Dashboard Title Section (Desktop only, as title is inside header on mobile) */}
        <div className="hidden md:block px-8 pt-8 pb-4 shrink-0">
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
        <main className="p-4 sm:p-8 flex-1 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
