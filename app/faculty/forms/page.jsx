'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Plus, Search, RefreshCw, FileText } from 'lucide-react';
import Link from 'next/link';
import FormCard from '@/components/forms/FormCard';

export default function FacultyFormsPage() {
  const pathname = usePathname();
  const baseHref = pathname.startsWith('/admin/forms')
    ? '/admin/forms'
    : pathname.startsWith('/student/forms')
    ? '/student/forms'
    : '/faculty/forms';

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, ...(search ? { search } : {}) });
      const res = await fetch(`/api/forms?${params}`);
      const data = await res.json();
      if (res.ok) { setForms(data.forms); setPagination(data.pagination); }
    } catch {}
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Forms</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Forms for your department</p>
        </div>
        <Link href={`${baseHref}/create`}
          className="flex items-center gap-2 px-4 py-2.5 bg-logo-teal text-white rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-sm">
          <Plus className="w-4 h-4" /> Create Form
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search forms…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-logo-teal/40 outline-none" />
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
          <p className="text-base font-semibold text-slate-600 dark:text-slate-400">No forms yet</p>
          <p className="text-sm text-slate-400 mb-5">Create your first form to start collecting responses</p>
          <Link href={`${baseHref}/create`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-logo-teal text-white rounded-xl text-sm font-semibold hover:opacity-90 transition">
            <Plus className="w-4 h-4" /> Create Form
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {forms.map(form => (
            <FormCard key={form.id} form={form} variant="faculty" baseHref={baseHref} />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-slate-500">{page} / {pagination.totalPages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages || loading}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
