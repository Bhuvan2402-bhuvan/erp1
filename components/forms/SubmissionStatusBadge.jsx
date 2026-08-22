'use client';

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  SUBMITTED: { label: 'Submitted', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  UNDER_REVIEW: { label: 'Under Review', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  APPROVED: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

export default function SubmissionStatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wide ${config.className} ${sizeClass}`}>
      {config.label}
    </span>
  );
}
