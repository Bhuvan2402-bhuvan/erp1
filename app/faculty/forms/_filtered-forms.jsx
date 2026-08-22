'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import FormCard from '@/components/forms/FormCard';
import { FileText, RefreshCw } from 'lucide-react';
import Link from 'next/link';

function FilteredFormsPage({ status, title, description, emptyMsg, badge }) {
  const pathname = usePathname();
  const baseHref = pathname.startsWith('/admin/forms')
    ? '/admin/forms'
    : pathname.startsWith('/student/forms')
    ? '/student/forms'
    : '/faculty/forms';

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forms?status=${status}&limit=50`);
      const data = await res.json();
      if (res.ok) setForms(data.forms || []);
    } catch {}
    setLoading(false);
  }, [status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {title}
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${badge}`}>
              {forms.length}
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        </div>
        <button onClick={load} disabled={loading} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-52" />)}
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-600 dark:text-slate-400">{emptyMsg}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {forms.map(form => (
            <FormCard key={form.id} form={form} variant="faculty" baseHref={baseHref} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DraftsPage() {
  return <FilteredFormsPage status="DRAFT" title="Drafts" description="Unpublished form drafts" emptyMsg="No draft forms" badge="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" />;
}
export function PublishedPage() {
  return <FilteredFormsPage status="PUBLISHED" title="Published" description="Forms currently accepting responses" emptyMsg="No published forms" badge="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" />;
}
export function ClosedPage() {
  return <FilteredFormsPage status="CLOSED" title="Closed" description="Forms no longer accepting responses" emptyMsg="No closed forms" badge="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" />;
}
