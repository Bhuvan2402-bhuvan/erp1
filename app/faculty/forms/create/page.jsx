'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Globe, Settings, Eye, ArrowLeft, Loader2, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import FormBuilder from '@/components/forms/FormBuilder';

const TABS = ['basic', 'fields', 'settings', 'preview'];

function Tab({ active, onClick, label }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
        active ? 'bg-logo-teal text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
      }`}>
      {label}
    </button>
  );
}

export default function CreateFormPage() {
  const router = useRouter();
  const [tab, setTab] = useState('basic');
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [formId, setFormId] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [departments, setDepartments] = useState([]);

  const [meta, setMeta] = useState({
    title: '',
    description: '',
    category: 'General',
    instructions: '',
    visibility: 'DEPARTMENT_ONLY',
    startsAt: '',
    endsAt: '',
    allowMultipleSubmissions: false,
    allowEditing: false,
    allowDraft: true,
    anonymous: false,
    maxResponses: '',
    confirmationMessage: 'Thank you for your submission!',
    notifyOnSubmission: true,
    notifyOnReview: true,
  });

  const updateMeta = (key, val) => setMeta(prev => ({ ...prev, [key]: val }));

  useEffect(() => {
    // Load departments for admin
    fetch('/api/departments').then(r => r.json()).then(d => {
      if (d.departments) setDepartments(d.departments);
    }).catch(() => {});
  }, []);

  const handleCreateDraft = async () => {
    if (!meta.title.trim()) { toast.error('Please enter a form title'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...meta, maxResponses: meta.maxResponses ? parseInt(meta.maxResponses) : null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setFormId(data.form.id);
      setDraftSaved(true);
      setTab('fields');
      toast.success('Form saved as draft — add your fields!');
    } catch (e) {
      toast.error(e.message || 'Failed to create form');
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async () => {
    if (!formId) { toast.error('Save the form first'); return; }
    setPublishing(true);
    try {
      const res = await fetch(`/api/forms/${formId}/publish`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Form published! Students can now fill it.');
      router.push('/faculty/forms/published');
    } catch (e) {
      toast.error(e.message || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const cardCls = 'bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6';
  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-sm focus:ring-2 focus:ring-logo-teal/40 focus:border-logo-teal outline-none transition text-slate-800 dark:text-slate-100';
  const labelCls = 'block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/faculty/forms" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Create Form</h1>
            {formId && <p className="text-xs text-emerald-500 mt-0.5">Draft saved</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!draftSaved ? (
            <button onClick={handleCreateDraft} disabled={creating}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </button>
          ) : (
            <button onClick={handlePublish} disabled={publishing}
              className="flex items-center gap-2 px-4 py-2.5 bg-logo-teal text-white rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              Publish Form
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        <Tab active={tab === 'basic'} onClick={() => setTab('basic')} label="1. Basic Info" />
        <Tab active={tab === 'fields'} onClick={() => { if (draftSaved) setTab('fields'); else toast.error('Save draft first'); }} label="2. Fields" />
        <Tab active={tab === 'settings'} onClick={() => { if (draftSaved) setTab('settings'); else toast.error('Save draft first'); }} label="3. Settings" />
      </div>

      {/* Basic Info Tab */}
      {tab === 'basic' && (
        <div className={`${cardCls} space-y-5`}>
          <div>
            <label className={labelCls}>Form Title <span className="text-red-500">*</span></label>
            <input value={meta.title} onChange={e => updateMeta('title', e.target.value)}
              className={inputCls} placeholder="e.g., CSE Volunteer Recruitment 2026" />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={meta.description} onChange={e => updateMeta('description', e.target.value)}
              className={`${inputCls} resize-none`} rows={3} placeholder="Brief description of this form's purpose" />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Category</label>
              <select value={meta.category} onChange={e => updateMeta('category', e.target.value)} className={inputCls}>
                <option>General</option>
                <option>Recruitment</option>
                <option>Feedback</option>
                <option>Registration</option>
                <option>Survey</option>
                <option>Application</option>
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
              <label className={labelCls}>End Date & Time (Deadline)</label>
              <input type="datetime-local" value={meta.endsAt} onChange={e => updateMeta('endsAt', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Instructions (shown to respondents)</label>
            <textarea value={meta.instructions} onChange={e => updateMeta('instructions', e.target.value)}
              className={`${inputCls} resize-none`} rows={2} placeholder="Any specific instructions for filling the form" />
          </div>
        </div>
      )}

      {/* Fields Tab */}
      {tab === 'fields' && formId && (
        <FormBuilder formId={formId} initialFields={[]} />
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className={`${cardCls} space-y-6`}>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Form Settings</h2>

          <div className="space-y-4">
            {[
              { key: 'allowMultipleSubmissions', label: 'Allow multiple submissions', desc: 'One student can submit more than once' },
              { key: 'allowEditing', label: 'Allow editing after submission', desc: 'Students can edit their submitted response' },
              { key: 'allowDraft', label: 'Allow saving draft', desc: 'Students can save progress before final submission' },
              { key: 'anonymous', label: 'Anonymous responses', desc: 'Do not associate response with student identity' },
              { key: 'notifyOnSubmission', label: 'Notify me on new submissions', desc: 'Receive a notification for each submission' },
              { key: 'notifyOnReview', label: 'Notify student on review', desc: 'Student gets notified when their response is reviewed' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
                <button type="button" onClick={() => updateMeta(key, !meta[key])}
                  className={`relative w-11 h-6 rounded-full transition-colors ${meta[key] ? 'bg-logo-teal' : 'bg-slate-200 dark:bg-slate-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${meta[key] ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Maximum Responses</label>
              <input type="number" min="1" value={meta.maxResponses}
                onChange={e => updateMeta('maxResponses', e.target.value)}
                className={inputCls} placeholder="Leave empty for unlimited" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Confirmation Message</label>
            <textarea value={meta.confirmationMessage}
              onChange={e => updateMeta('confirmationMessage', e.target.value)}
              className={`${inputCls} resize-none`} rows={2}
              placeholder="Message shown after successful submission" />
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      {!draftSaved && (
        <div className="flex justify-end">
          <button onClick={handleCreateDraft} disabled={creating || !meta.title.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-logo-teal text-white rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Continue to Fields
          </button>
        </div>
      )}
    </div>
  );
}
