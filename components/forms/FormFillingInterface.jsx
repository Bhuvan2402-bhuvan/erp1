'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Save, Send, AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import SubmissionStatusBadge from './SubmissionStatusBadge';

const CHOICE_TYPES = ['dropdown', 'radio', 'checkbox', 'multi_select', 'yes_no'];
const LAYOUT_TYPES = ['section', 'heading', 'description', 'divider'];

// ── Individual Field Renderer ─────────────────────────────────────────────────

function FieldInput({ field, value, onChange, error }) {
  const ft = field.fieldType;
  const opts = field.options || [];
  const inputBase = `w-full px-3 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 ${
    error
      ? 'border-red-300 dark:border-red-700 focus:ring-red-300/50'
      : 'border-slate-200 dark:border-slate-700 focus:ring-logo-teal/40 focus:border-logo-teal'
  } bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400`;

  if (ft === 'divider') return <hr className="border-slate-200 dark:border-slate-700" />;
  if (ft === 'heading') return <h3 className="text-lg font-bold text-slate-900 dark:text-white">{field.label}</h3>;
  if (ft === 'description') return <p className="text-sm text-slate-600 dark:text-slate-400">{field.label}</p>;
  if (ft === 'section') return <div className="h-px bg-gradient-to-r from-logo-navy to-logo-teal" />;

  if (['short_text', 'email', 'phone', 'url'].includes(ft)) {
    return <input type={ft === 'email' ? 'email' : ft === 'url' ? 'url' : ft === 'phone' ? 'tel' : 'text'}
      className={inputBase} placeholder={field.placeholder || ''} value={value || ''}
      onChange={e => onChange(e.target.value)} />;
  }
  if (ft === 'number') {
    return <input type="number" className={inputBase} placeholder={field.placeholder || ''}
      value={value || ''} onChange={e => onChange(e.target.value)}
      min={field.validationRules?.min} max={field.validationRules?.max} />;
  }
  if (ft === 'long_text') {
    return <textarea className={`${inputBase} resize-none`} rows={4}
      placeholder={field.placeholder || ''} value={value || ''}
      onChange={e => onChange(e.target.value)} />;
  }
  if (ft === 'date') return <input type="date" className={inputBase} value={value || ''} onChange={e => onChange(e.target.value)} />;
  if (ft === 'time') return <input type="time" className={inputBase} value={value || ''} onChange={e => onChange(e.target.value)} />;
  if (ft === 'datetime') return <input type="datetime-local" className={inputBase} value={value || ''} onChange={e => onChange(e.target.value)} />;

  if (ft === 'dropdown') {
    return (
      <select className={inputBase} value={value || ''} onChange={e => onChange(e.target.value)}>
        <option value="">{field.placeholder || 'Select an option'}</option>
        {opts.map((o, i) => <option key={i} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  if (ft === 'radio' || ft === 'yes_no') {
    const radioOpts = ft === 'yes_no' ? [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] : opts;
    return (
      <div className="space-y-2">
        {radioOpts.map((o, i) => (
          <label key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-logo-teal/50 hover:bg-logo-teal/5 cursor-pointer transition group">
            <input type="radio" name={field.id} value={o.value} checked={value === o.value}
              onChange={() => onChange(o.value)} className="accent-logo-teal w-4 h-4 shrink-0" />
            <span className="text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">{o.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (ft === 'checkbox' || ft === 'multi_select') {
    const selected = Array.isArray(value) ? value : (value ? [value] : []);
    const toggle = (v) => {
      const next = selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v];
      onChange(next);
    };
    return (
      <div className="space-y-2">
        {opts.map((o, i) => (
          <label key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-logo-teal/50 hover:bg-logo-teal/5 cursor-pointer transition group">
            <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggle(o.value)}
              className="accent-logo-teal w-4 h-4 shrink-0" />
            <span className="text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">{o.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (ft === 'rating') {
    const val = parseInt(value) || 0;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onChange(String(n))}
            className={`text-3xl transition hover:scale-110 ${n <= val ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700 hover:text-amber-300'}`}>★</button>
        ))}
      </div>
    );
  }

  if (ft === 'linear_scale') {
    const val = parseInt(value) || 0;
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">1</span>
        <div className="flex gap-1 flex-1">
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button key={n} type="button" onClick={() => onChange(String(n))}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                n <= val ? 'bg-logo-teal border-logo-teal text-white' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-logo-teal/50'
              }`}>{n}</button>
          ))}
        </div>
        <span className="text-xs text-slate-400">10</span>
      </div>
    );
  }

  if (ft === 'file_upload' || ft === 'image_upload') {
    return (
      <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:border-logo-teal/50 transition">
        <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-400">Click to upload {ft === 'image_upload' ? 'image' : 'file'}</p>
        <input type="file" accept={ft === 'image_upload' ? 'image/*' : undefined}
          className="hidden" onChange={e => {
            const file = e.target.files?.[0];
            if (file) onChange(file.name); // simplified — real upload via API
          }} />
        {value && <p className="text-xs text-logo-teal mt-1">{value}</p>}
      </div>
    );
  }

  return <input className={inputBase} placeholder={field.placeholder || ''} value={value || ''} onChange={e => onChange(e.target.value)} />;
}

// ── Evaluate conditional visibility ─────────────────────────────────────────

function evaluateCondition(field, answers) {
  const rules = field.conditionalRules;
  if (!rules || !rules.conditions?.length) return true;
  const { conditions, action, logic = 'any' } = rules;
  const results = conditions.map(c => {
    const ans = answers[c.fieldId];
    if (c.operator === 'eq') return String(ans) === String(c.value);
    if (c.operator === 'neq') return String(ans) !== String(c.value);
    if (c.operator === 'contains') return String(ans).toLowerCase().includes(String(c.value).toLowerCase());
    return false;
  });
  const match = logic === 'all' ? results.every(Boolean) : results.some(Boolean);
  return action === 'show' ? match : !match;
}

// ── Main FormFillingInterface ─────────────────────────────────────────────────

export default function FormFillingInterface({ form, existingResponse, onSuccess }) {
  const fields = form.fields || [];
  const nonLayoutFields = fields.filter(f => !LAYOUT_TYPES.includes(f.fieldType));

  const [answers, setAnswers] = useState(() => {
    const init = {};
    if (existingResponse?.answers) {
      for (const a of existingResponse.answers) {
        init[a.fieldId] = a.values || a.value;
      }
    }
    return init;
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const setAnswer = (fieldId, val) => setAnswers(prev => ({ ...prev, [fieldId]: val }));

  const validate = () => {
    const errs = {};
    for (const field of nonLayoutFields) {
      if (!field.required) continue;
      if (!evaluateCondition(field, answers)) continue; // hidden by conditional
      const ans = answers[field.id];
      const isEmpty = Array.isArray(ans) ? ans.length === 0 : !ans;
      if (isEmpty) errs[field.id] = 'This field is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildPayload = (isDraft) => ({
    isDraft,
    answers: nonLayoutFields.map(f => {
      const val = answers[f.id];
      const isArray = Array.isArray(val);
      return { fieldId: f.id, value: isArray ? null : val || null, values: isArray ? val : null };
    }),
  });

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/forms/${form.id}/responses`, {
        method: existingResponse ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(true)),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      toast.success('Draft saved');
    } catch (e) {
      toast.error(e.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) { toast.error('Please fill in all required fields'); return; }
    setConfirmed(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      const method = existingResponse ? 'PATCH' : 'POST';
      const url = existingResponse
        ? `/api/forms/${form.id}/responses/${existingResponse.id}`
        : `/api/forms/${form.id}/responses`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(false)),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setSubmitted(true);
      onSuccess?.();
    } catch (e) {
      toast.error(e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
      setConfirmed(false);
    }
  };

  const progress = nonLayoutFields.filter(f => {
    const v = answers[f.id];
    return Array.isArray(v) ? v.length > 0 : !!v;
  }).length;
  const progressPct = nonLayoutFields.length > 0 ? Math.round((progress / nonLayoutFields.length) * 100) : 0;

  // ── Confirmation Dialog ────────────────────────────────────────────────────

  if (confirmed && !submitted) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-logo-teal/10 rounded-2xl flex items-center justify-center mx-auto">
            <Send className="w-8 h-8 text-logo-teal" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ready to Submit?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You&apos;re about to submit your response to <strong>&quot;{form.title}&quot;</strong>.{' '}
            {!form.allowEditing && "You won't be able to edit after submission."}
          </p>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setConfirmed(false)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
              Go Back
            </button>
            <button onClick={handleConfirmSubmit} disabled={submitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-logo-teal text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Submitting…' : 'Confirm Submit'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Success Screen ─────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Submitted!</h2>
          <p className="text-slate-500 dark:text-slate-400">
            {form.confirmationMessage || 'Thank you for your submission!'}
          </p>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Form Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {form.coverImageUrl && (
          <div className="h-36 bg-gradient-to-br from-logo-navy to-logo-teal relative overflow-hidden">
            <Image src={form.coverImageUrl} alt={form.title || 'Form cover'} fill className="object-cover opacity-70" unoptimized />
          </div>
        )}
        {!form.coverImageUrl && <div className="h-2 bg-gradient-to-r from-logo-navy to-logo-teal" />}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{form.title}</h1>
          {form.description && <p className="text-slate-500 dark:text-slate-400 text-sm">{form.description}</p>}
          {form.instructions && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl text-sm text-blue-700 dark:text-blue-300">
              {form.instructions}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {nonLayoutFields.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-logo-navy to-logo-teal rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">{progressPct}%</span>
        </div>
      )}

      {/* Fields */}
      <div className="space-y-5">
        {fields.map(field => {
          const visible = evaluateCondition(field, answers);
          if (!visible) return null;
          const isLayout = LAYOUT_TYPES.includes(field.fieldType);
          const err = errors[field.id];

          if (isLayout) {
            return (
              <div key={field.id} className={field.fieldType === 'section' ? 'pt-2' : ''}>
                <FieldInput field={field} value={answers[field.id]} onChange={v => setAnswer(field.id, v)} />
              </div>
            );
          }

          return (
            <div key={field.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
              <div>
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{field.description}</p>}
              </div>
              <FieldInput field={field} value={answers[field.id]} onChange={v => setAnswer(field.id, v)} error={err} />
              {field.helpText && <p className="text-xs text-slate-400">{field.helpText}</p>}
              {err && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {err}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Required indicator */}
      {nonLayoutFields.some(f => f.required) && (
        <p className="text-xs text-slate-400"><span className="text-red-500">*</span> Required fields</p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pb-8">
        {form.allowDraft !== false && (
          <button onClick={handleSaveDraft} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
        )}
        <button onClick={handleSubmit} disabled={submitting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-logo-teal text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
          <Send className="w-4 h-4" /> Submit
        </button>
      </div>
    </div>
  );
}
