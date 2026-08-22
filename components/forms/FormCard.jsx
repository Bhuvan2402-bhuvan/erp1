'use client';
import { Clock, Users, Calendar, CheckCircle, XCircle, Edit3, FileText } from 'lucide-react';
import Link from 'next/link';

const STATUS_COLORS = {
  PUBLISHED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  CLOSED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  ARCHIVED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
};

export default function FormCard({ form, variant = 'student', baseHref }) {
  const deadline = form.endsAt ? new Date(form.endsAt) : null;
  const isExpired = deadline && deadline < new Date();
  const fieldCount = form.fieldCount ?? form._count?.fields ?? 0;
  const estimatedMins = form.estimatedMinutes ?? Math.max(1, Math.ceil(fieldCount * 0.5));
  const myResponse = form.myResponse;

  const deadlineStr = deadline
    ? deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'No deadline';

  const visibilityLabels = {
    DEPARTMENT_ONLY: 'Dept Volunteers',
    ALL_VOLUNTEERS: 'All Volunteers',
    INTERNAL_DEPT: 'Internal Dept',
    FACULTY_ONLY: 'Faculty Only',
    COORDINATORS_ONLY: 'Coordinators Only',
    ADMIN_ONLY: 'Admins Only',
    SELECTED_DEPARTMENTS: 'Selected Depts',
    SELECTED_USERS: 'Selected Users',
  };

  if (variant === 'student') {
    const canFill = form.status === 'PUBLISHED' && !isExpired && !myResponse;
    const canView = !!myResponse && myResponse.status !== 'DRAFT';
    const canEdit = !!myResponse && myResponse.status === 'DRAFT' && form.allowEditing !== false;
    const isClosed = form.status === 'CLOSED' || isExpired;

    return (
      <div className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-logo-teal/30 transition-all duration-200">
        {form.coverImageUrl && (
          <div className="h-32 bg-gradient-to-br from-logo-navy/10 to-logo-teal/10 relative overflow-hidden">
            <img src={form.coverImageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {!form.coverImageUrl && (
          <div className="h-2 bg-gradient-to-r from-logo-navy to-logo-teal" />
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">{form.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{form.department?.code || 'GEN'}</span>
                <span>•</span>
                <span>{visibilityLabels[form.visibility] || form.visibility}</span>
              </p>
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_COLORS[form.status] || STATUS_COLORS.DRAFT}`}>
              {form.status}
            </span>
          </div>

          {form.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">{form.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {fieldCount} questions
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              ~{estimatedMins} min
            </span>
            <span className={`flex items-center gap-1 ${isExpired ? 'text-red-500' : ''}`}>
              <Calendar className="w-3.5 h-3.5" />
              {deadlineStr}
            </span>
          </div>

          {myResponse && (
            <div className={`mb-3 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 
              ${myResponse.status === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' :
                myResponse.status === 'REJECTED' ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300' :
                myResponse.status === 'DRAFT' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' :
                'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'}`}>
              {myResponse.status === 'APPROVED' && <CheckCircle className="w-3.5 h-3.5" />}
              {myResponse.status === 'REJECTED' && <XCircle className="w-3.5 h-3.5" />}
              Submission: {myResponse.status}
            </div>
          )}

          <div className="flex gap-2">
            {canFill && (
              <Link href={`${baseHref}/${form.id}/fill`}
                className="flex-1 py-2 px-4 bg-logo-teal text-white rounded-xl text-sm font-semibold text-center hover:opacity-90 transition">
                Fill Form
              </Link>
            )}
            {(canView || (myResponse && !canEdit)) && (
              <Link href={`${baseHref}/${form.id}/submission`}
                className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold text-center hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                View Submission
              </Link>
            )}
            {canEdit && (
              <Link href={`${baseHref}/${form.id}/fill`}
                className="flex-1 py-2 px-4 border border-logo-teal text-logo-teal rounded-xl text-sm font-semibold text-center hover:bg-logo-teal/5 transition flex items-center justify-center gap-1">
                <Edit3 className="w-3.5 h-3.5" /> Edit Draft
              </Link>
            )}
            {isClosed && !myResponse && (
              <span className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-xl text-sm font-semibold text-center cursor-not-allowed">
                Closed
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Faculty/Admin variant
  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="h-1.5 bg-gradient-to-r from-logo-navy to-logo-teal" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-white truncate">{form.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{form.department?.code || 'GEN'}</span>
              <span>·</span>
              <span className="text-logo-teal font-medium">{visibilityLabels[form.visibility] || form.visibility}</span>
              <span>·</span>
              <span>{form.category}</span>
            </p>
          </div>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_COLORS[form.status] || STATUS_COLORS.DRAFT}`}>
            {form.status}
          </span>
        </div>

        {form.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{form.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            {form._count?.fields ?? 0} fields
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {form._count?.responses ?? 0} responses
          </span>
          {deadline && (
            <span className={`flex items-center gap-1 ${isExpired ? 'text-red-500' : ''}`}>
              <Calendar className="w-3.5 h-3.5" />
              {deadlineStr}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Link href={`${baseHref}/${form.id}/edit`}
            className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium text-center hover:bg-slate-200 dark:hover:bg-slate-600 transition">
            Edit
          </Link>
          <Link href={`${baseHref}/${form.id}/responses`}
            className="flex-1 py-2 px-3 bg-logo-teal/10 text-logo-teal rounded-xl text-sm font-medium text-center hover:bg-logo-teal/20 transition">
            Responses
          </Link>
        </div>
      </div>
    </div>
  );
}
