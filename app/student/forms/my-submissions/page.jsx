'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ClipboardCheck, RefreshCw, Eye, Edit3 } from 'lucide-react';
import SubmissionStatusBadge from '@/components/forms/SubmissionStatusBadge';
import FormsHeaderTabs from '@/components/forms/FormsHeaderTabs';

export default function MySubmissionsPage() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forms/my-submissions?page=${page}&limit=20`);
      const data = await res.json();
      if (res.ok) { setResponses(data.responses); setPagination(data.pagination); }
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Submissions</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track the status of your submitted responses and drafts</p>
      </div>

      <FormsHeaderTabs canCreate={false} />

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
        </div>
      ) : responses.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <ClipboardCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-600 dark:text-slate-400">No submissions yet</p>
          <p className="text-sm text-slate-400 mb-5">Fill in available forms to see them here</p>
          <Link href="/student/forms/available" className="inline-flex items-center gap-2 px-5 py-2.5 bg-logo-teal text-white rounded-xl text-sm font-semibold hover:opacity-90 transition">
            Browse Forms
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {responses.map(r => (
            <div key={r.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4 hover:shadow-sm transition">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{r.form?.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {r.form?.department?.code} · {r.form?.createdBy?.name}
                  {r.submittedAt && ` · Submitted ${new Date(r.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                </p>
              </div>
              <SubmissionStatusBadge status={r.status} size="xs" />
              <div className="flex gap-2">
                <Link href={`/student/forms/${r.form.id}/submission`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                  <Eye className="w-3.5 h-3.5" /> View
                </Link>
                {r.status === 'DRAFT' && r.form?.allowEditing !== false && (
                  <Link href={`/student/forms/${r.form.id}/fill`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-logo-teal text-logo-teal text-sm font-medium hover:bg-logo-teal/5 transition">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </Link>
                )}
              </div>
            </div>
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
