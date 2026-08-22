'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Globe, Lock, Archive, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import FormBuilder from '@/components/forms/FormBuilder';

const TABS = ['basic', 'fields', 'settings'];

export default function EditFormPage() {
  const { formId } = useParams();
  const router = useRouter();
  const [tab, setTab] = useState('fields');
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [meta, setMeta] = useState({});
  const updateMeta = (k, v) => setMeta(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    fetch(`/api/forms/${formId}`).then(r => r.json()).then(d => {
      if (d.form) {
        setForm(d.form);
        setMeta({
          title: d.form.title,
          description: d.form.description || '',
          category: d.form.category || 'General',
          instructions: d.form.instructions || '',
          visibility: d.form.visibility,
          startsAt: d.form.startsAt ? new Date(d.form.startsAt).toISOString().slice(0, 16) : '',
          endsAt: d.form.endsAt ? new Date(d.form.endsAt).toISOString().slice(0, 16) : '',
          allowMultipleSubmissions: d.form.allowMultipleSubmissions,
          allowEditing: d.form.allowEditing,
          allowDraft: d.form.allowDraft,
          anonymous: d.form.anonymous,
          maxResponses: d.form.maxResponses || '',
          confirmationMessage: d.form.confirmationMessage,
          notifyOnSubmission: d.form.notifyOnSubmission,
          notifyOnReview: d.form.notifyOnReview,
        });
      }
    }).catch(() => toast.error('Failed to load form')).finally(() => setLoading(false));
  }, [formId]);

  const handleSaveMeta = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...meta, maxResponses: meta.maxResponses ? parseInt(meta.maxResponses) : null }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success('Form saved');
    } catch (e) { toast.error(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/forms/${formId}/publish`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success('Form published!');
      router.push('/faculty/forms/published');
    } catch (e) { toast.error(e.message || 'Failed to publish'); }
    finally { setPublishing(false); }
  };

  const handleClose = async () => {
    if (!confirm('Close this form? Students will no longer be able to submit.')) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/forms/${formId}/close`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success('Form closed');
      router.push('/faculty/forms/closed');
    } catch (e) { toast.error(e.message || 'Failed to close'); }
    finally { setClosing(false); }
  };

  const handleArchive = async () => {
    if (!confirm('Archive this form? It will be hidden from all lists.')) return;
    setArchiving(true);
    try {
      const res = await fetch(`/api/forms/${formId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success('Form archived');
      router.push('/faculty/forms');
    } catch (e) { toast.error(e.message || 'Failed to archive'); }
    finally { setArchiving(false); }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
      <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
      <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
    </div>
  );

  if (!form) return (
    <div className="max-w-4xl mx-auto py-20 text-center text-slate-400">
      <p>Form not found or you don&apos;t have access to it.</p>
      <Link href="/faculty/forms" className="text-logo-teal mt-2 inline-block">Back to forms</Link>
    </div>
  );

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-sm focus:ring-2 focus:ring-logo-teal/40 focus:border-logo-teal outline-none transition text-slate-800 dark:text-slate-100';
  const labelCls = 'block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/faculty/forms" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate max-w-xs">{form.title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{form.department?.name} · {form.status}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {form.status === 'DRAFT' && (
            <button onClick={handlePublish} disabled={publishing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-logo-teal text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />} Publish
            </button>
          )}
          {form.status === 'PUBLISHED' && (
            <button onClick={handleClose} disabled={closing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-semibold hover:bg-red-100 transition disabled:opacity-50">
              {closing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Close
            </button>
          )}
          {form.status !== 'ARCHIVED' && (
            <button onClick={handleArchive} disabled={archiving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50">
              {archiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />} Archive
            </button>
          )}
          <Link href={`/faculty/forms/${formId}/responses`}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            Responses
          </Link>
          <Link href={`/faculty/forms/${formId}/analytics`}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            Analytics
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition ${tab === t ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {t === 'basic' ? 'Basic Info' : t === 'fields' ? 'Fields' : 'Settings'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'basic' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
          <div>
            <label className={labelCls}>Title <span className="text-red-500">*</span></label>
            <input value={meta.title} onChange={e => updateMeta('title', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={meta.description} onChange={e => updateMeta('description', e.target.value)} className={`${inputCls} resize-none`} rows={3} />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Category</label>
              <select value={meta.category} onChange={e => updateMeta('category', e.target.value)} className={inputCls}>
                {['General','Recruitment','Feedback','Registration','Survey','Application'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Visibility</label>
              <select value={meta.visibility} onChange={e => updateMeta('visibility', e.target.value)} className={inputCls}>
                <option value="DEPARTMENT_ONLY">Department Only</option>
                <option value="ALL_VOLUNTEERS">All Volunteers</option>
                <option value="SELECTED_DEPARTMENTS">Selected Departments</option>
                <option value="SELECTED_USERS">Selected Users</option>
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Start Date & Time</label>
              <input type="datetime-local" value={meta.startsAt} onChange={e => updateMeta('startsAt', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Date & Time</label>
              <input type="datetime-local" value={meta.endsAt} onChange={e => updateMeta('endsAt', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Instructions</label>
            <textarea value={meta.instructions} onChange={e => updateMeta('instructions', e.target.value)} className={`${inputCls} resize-none`} rows={2} />
          </div>
          <div className="flex justify-end">
            <button onClick={handleSaveMeta} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-logo-teal text-white rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
            </button>
          </div>
        </div>
      )}

      {tab === 'fields' && (
        <FormBuilder formId={formId} initialFields={form.fields || []} />
      )}

      {tab === 'settings' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          {[
            { key: 'allowMultipleSubmissions', label: 'Allow multiple submissions' },
            { key: 'allowEditing', label: 'Allow editing after submission' },
            { key: 'allowDraft', label: 'Allow saving draft' },
            { key: 'anonymous', label: 'Anonymous responses' },
            { key: 'notifyOnSubmission', label: 'Notify on new submissions' },
            { key: 'notifyOnReview', label: 'Notify student on review' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p>
              <button type="button" onClick={() => updateMeta(key, !meta[key])}
                className={`relative w-11 h-6 rounded-full transition-colors ${meta[key] ? 'bg-logo-teal' : 'bg-slate-200 dark:bg-slate-600'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${meta[key] ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          ))}
          <div>
            <label className={labelCls}>Confirmation Message</label>
            <textarea value={meta.confirmationMessage} onChange={e => updateMeta('confirmationMessage', e.target.value)}
              className={`${inputCls} resize-none`} rows={2} />
          </div>
          <div className="flex justify-end">
            <button onClick={handleSaveMeta} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-logo-teal text-white rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
