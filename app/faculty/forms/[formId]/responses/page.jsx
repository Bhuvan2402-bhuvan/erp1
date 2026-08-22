'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import ResponseTable from '@/components/forms/ResponseTable';

export default function FormResponsesPage() {
  const { formId } = useParams();
  const pathname = usePathname();
  const baseHref = pathname.startsWith('/admin/forms')
    ? '/admin/forms'
    : pathname.startsWith('/student/forms')
    ? '/student/forms'
    : '/faculty/forms';

  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}) });
      const [formRes, respRes] = await Promise.all([
        fetch(`/api/forms/${formId}`),
        fetch(`/api/forms/${formId}/responses?${params}`),
      ]);
      const formData = await formRes.json();
      const respData = await respRes.json();
      if (formData.form) setForm(formData.form);
      if (respData.responses) { setResponses(respData.responses); setPagination(respData.pagination); }
    } catch { toast.error('Failed to load responses'); }
    finally { setLoading(false); }
  }, [formId, page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href={`${baseHref}/${formId}/edit`} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Responses</h1>
            {form && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{form.title}</p>}
          </div>
        </div>
        <Link href={`${baseHref}/${formId}/analytics`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
          <BarChart3 className="w-4 h-4" /> Analytics
        </Link>
      </div>

      <ResponseTable
        formId={formId}
        responses={responses}
        pagination={pagination}
        loading={loading}
        onPageChange={setPage}
        onSearch={v => { setSearch(v); setPage(1); }}
        onStatusFilter={v => { setStatusFilter(v); setPage(1); }}
        onRefresh={load}
        baseHref={`${baseHref}/${formId}/responses`}
      />
    </div>
  );
}
