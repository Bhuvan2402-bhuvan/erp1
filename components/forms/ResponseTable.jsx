'use client';
import { useState } from 'react';
import {
  Search, Filter, ChevronDown, Eye, Check, X, MessageSquare,
  Download, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import SubmissionStatusBadge from './SubmissionStatusBadge';

const STATUS_OPTIONS = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DRAFT'];

export default function ResponseTable({ formId, responses, pagination, loading, onPageChange, onSearch, onStatusFilter, onRefresh, baseHref }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const handleSearch = (val) => {
    setSearch(val);
    onSearch?.(val);
  };
  const handleStatusFilter = (val) => {
    setStatusFilter(val);
    onStatusFilter?.(val);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by name, roll number…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-logo-teal/40 focus:border-logo-teal outline-none transition"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={e => handleStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-logo-teal/40 outline-none"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <a href={`/api/forms/${formId}/export?format=csv`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            <Download className="w-4 h-4" /> CSV
          </a>
          <a href={`/api/forms/${formId}/export?format=xlsx`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition">
            <Download className="w-4 h-4" /> Excel
          </a>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-700 animate-pulse">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-2 w-24 bg-slate-100 dark:bg-slate-600 rounded" />
                </div>
                <div className="h-5 w-20 bg-slate-100 dark:bg-slate-700 rounded-full" />
              </div>
            ))}
          </div>
        ) : responses.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-medium">No responses yet</p>
            <p className="text-sm mt-1">Responses will appear here after students submit</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Student</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Roll No</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Submitted</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {responses.map(r => {
                    const student = r.submittedBy;
                    const initials = student?.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-logo-navy to-logo-teal text-white text-xs font-bold flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-100">{student?.name}</p>
                              <p className="text-xs text-slate-400">{student?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs">
                          {student?.student?.rollNo || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                          {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <SubmissionStatusBadge status={r.status} size="xs" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Link href={`${baseHref}/${r.id}`}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-400">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onPageChange?.(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-xs text-slate-600 dark:text-slate-300">{pagination.page} / {pagination.totalPages}</span>
                  <button
                    onClick={() => onPageChange?.(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
