'use client';
import { useState } from 'react';
import { CheckCircle2, XCircle, MessageSquare, Clock, Send, Loader2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import SubmissionStatusBadge from './SubmissionStatusBadge';

const LAYOUT_TYPES = ['section', 'heading', 'description', 'divider'];

function AnswerDisplay({ field, answer }) {
  if (!answer) return <p className="text-slate-400 italic text-sm">No answer provided</p>;

  const val = answer.values?.length ? (Array.isArray(answer.values) ? answer.values.join(', ') : answer.values) : answer.value;

  if (field.fieldType === 'rating') {
    return (
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(n => (
          <span key={n} className={`text-xl ${n <= parseInt(val) ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}>★</span>
        ))}
        <span className="ml-2 text-sm text-slate-500">({val}/5)</span>
      </div>
    );
  }

  if (field.fieldType === 'file_upload' || field.fieldType === 'image_upload') {
    if (answer.fileUrl) {
      return field.fieldType === 'image_upload'
        ? <img src={answer.fileUrl} alt="Uploaded" className="max-w-xs rounded-xl border border-slate-200 dark:border-slate-700" />
        : <a href={answer.fileUrl} target="_blank" rel="noopener" className="text-logo-teal hover:underline text-sm">{val || 'View file'}</a>;
    }
  }

  return <p className="text-slate-800 dark:text-slate-100 text-sm font-medium">{val || '—'}</p>;
}

export default function ResponseDetailView({ response, form, canReview, onStatusChange, backHref }) {
  const [status, setStatus] = useState(response.status);
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState(response.notes || []);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  const answerMap = {};
  for (const a of (response.answers || [])) answerMap[a.fieldId] = a;

  const visibleFields = (form.fields || []).filter(f => !LAYOUT_TYPES.includes(f.fieldType));

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/forms/${form.id}/responses/${response.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setStatus(newStatus);
      onStatusChange?.(newStatus);
      toast.success(`Response ${newStatus.toLowerCase().replace('_', ' ')}`);
    } catch (e) {
      toast.error(e.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/forms/${form.id}/responses/${response.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText }),
      });
      if (!res.ok) throw new Error('Failed to add note');
      const { note } = await res.json();
      setNotes(prev => [...prev, note]);
      setNoteText('');
      toast.success('Note added');
    } catch (e) {
      toast.error(e.message || 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const student = response.submittedBy;
  const initials = student?.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      {backHref && (
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition">
          <ChevronLeft className="w-4 h-4" /> Back to responses
        </Link>
      )}

      {/* Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-logo-navy to-logo-teal text-white font-bold flex items-center justify-center text-lg">
              {initials}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">{student?.name}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{student?.email}</p>
              {student?.student && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {student.student.rollNo} · Year {student.student.year} · {student.student.department?.code}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <SubmissionStatusBadge status={status} />
            {response.submittedAt && (
              <p className="text-xs text-slate-400">
                Submitted {new Date(response.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        {/* Review Actions */}
        {canReview && (
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-2">
            <button onClick={() => handleStatusChange('UNDER_REVIEW')} disabled={updatingStatus || status === 'UNDER_REVIEW'}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50 disabled:opacity-40 transition">
              <Clock className="w-4 h-4" /> Mark Under Review
            </button>
            <button onClick={() => handleStatusChange('APPROVED')} disabled={updatingStatus || status === 'APPROVED'}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 disabled:opacity-40 transition">
              <CheckCircle2 className="w-4 h-4" /> Approve
            </button>
            <button onClick={() => handleStatusChange('REJECTED')} disabled={updatingStatus || status === 'REJECTED'}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/50 disabled:opacity-40 transition">
              <XCircle className="w-4 h-4" /> Reject
            </button>
            {updatingStatus && <Loader2 className="w-4 h-4 animate-spin text-slate-400 self-center" />}
          </div>
        )}
      </div>

      {/* Answers */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/50">
        <div className="px-6 py-4">
          <h2 className="font-bold text-slate-800 dark:text-slate-100">Responses</h2>
          <p className="text-xs text-slate-400 mt-0.5">{visibleFields.length} questions</p>
        </div>
        {visibleFields.map((field, i) => (
          <div key={field.id} className="px-6 py-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Q{i + 1}</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">{field.label}</p>
            <AnswerDisplay field={field} answer={answerMap[field.id]} />
          </div>
        ))}
      </div>

      {/* Internal Notes */}
      {canReview && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            Internal Notes
          </h2>

          {notes.length > 0 && (
            <div className="space-y-3">
              {notes.map(note => (
                <div key={note.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{note.author?.name}</span>
                    <span className="text-xs text-slate-400">{new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{note.note}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add an internal note…"
              rows={2}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-logo-teal/40 outline-none resize-none"
            />
            <button onClick={handleAddNote} disabled={addingNote || !noteText.trim()}
              className="px-4 py-2 rounded-xl bg-logo-teal text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition flex items-center gap-1.5 self-end">
              {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
