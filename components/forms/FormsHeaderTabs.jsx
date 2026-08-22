'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, CheckCircle2, FileEdit, Archive, Inbox, Send, Plus } from 'lucide-react';

export default function FormsHeaderTabs({ canCreate = true }) {
  const pathname = usePathname();

  const isAdmin = pathname.startsWith('/admin');
  const isStudent = pathname.startsWith('/student');
  const isFaculty = pathname.startsWith('/faculty');

  const baseHref = isAdmin
    ? '/admin/forms'
    : isStudent
    ? '/student/forms'
    : '/faculty/forms';

  const tabs = [
    { label: 'All Forms', href: baseHref, icon: LayoutGrid, exact: true },
    { label: 'Published', href: `${baseHref}/published`, icon: CheckCircle2 },
    { label: 'Drafts', href: `${baseHref}/drafts`, icon: FileEdit },
    { label: 'Closed', href: `${baseHref}/closed`, icon: Archive },
  ];

  if (isStudent) {
    tabs.unshift(
      { label: 'Available Forms', href: `${baseHref}/available`, icon: Inbox },
      { label: 'My Submissions', href: `${baseHref}/my-submissions`, icon: Send }
    );
  }

  const isActive = (tab) => {
    if (tab.exact) {
      return pathname === tab.href;
    }
    return pathname.startsWith(tab.href);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                active
                  ? 'bg-logo-teal text-white shadow-sm shadow-logo-teal/20'
                  : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Create Form Action */}
      {canCreate && (
        <Link
          href={`${baseHref}/create`}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-logo-navy via-logo-teal to-emerald-500 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Create New Form
        </Link>
      )}
    </div>
  );
}
