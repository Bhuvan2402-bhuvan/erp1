'use client';
import { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';

const LAYOUT_TYPES = ['section', 'heading', 'description', 'divider'];
const CHOICE_TYPES = ['dropdown', 'radio', 'checkbox', 'multi_select'];
const HAS_VALIDATION = ['short_text', 'long_text', 'number', 'email', 'phone', 'url', 'rating', 'linear_scale'];

export default function FieldConfigPanel({ field, onSave, onClose }) {
  const [form, setForm] = useState({
    label: field.label || '',
    description: field.description || '',
    placeholder: field.placeholder || '',
    required: field.required || false,
    helpText: field.helpText || '',
    defaultValue: field.defaultValue || '',
    options: field.options || [],
    validationRules: field.validationRules || {},
    conditionalRules: field.conditionalRules || null,
  });

  const isLayout = LAYOUT_TYPES.includes(field.fieldType);
  const isChoice = CHOICE_TYPES.includes(field.fieldType);
  const hasValidation = HAS_VALIDATION.includes(field.fieldType);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const updateValidation = (key, val) => setForm(prev => ({
    ...prev,
    validationRules: { ...prev.validationRules, [key]: val || undefined },
  }));

  const addOption = () => {
    const newOpts = [...(form.options || []), { label: '', value: '' }];
    update('options', newOpts);
  };
  const updateOption = (i, key, val) => {
    const opts = [...(form.options || [])];
    opts[i] = { ...opts[i], [key]: val };
    if (key === 'label' && !opts[i].value) opts[i].value = val.toLowerCase().replace(/\s+/g, '_');
    update('options', opts);
  };
  const removeOption = (i) => {
    const opts = [...(form.options || [])];
    opts.splice(i, 1);
    update('options', opts);
  };

  const handleSave = () => {
    const cleaned = { ...form };
    if (!isChoice) delete cleaned.options;
    if (isLayout) { delete cleaned.required; delete cleaned.validationRules; delete cleaned.placeholder; delete cleaned.defaultValue; }
    onSave(cleaned);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white capitalize">{field.fieldType.replace(/_/g, ' ')} Settings</h2>
            <p className="text-xs text-slate-400 mt-0.5">Configure this field</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Label */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Label {!isLayout && <span className="text-red-500">*</span>}
            </label>
            <input
              value={form.label}
              onChange={e => update('label', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-logo-teal/40 focus:border-logo-teal outline-none transition"
              placeholder="Question or field label"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Description / Sub-label</label>
            <input
              value={form.description}
              onChange={e => update('description', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-logo-teal/40 outline-none transition"
              placeholder="Optional description"
            />
          </div>

          {!isLayout && (
            <>
              {/* Placeholder */}
              {!isChoice && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Placeholder</label>
                  <input
                    value={form.placeholder}
                    onChange={e => update('placeholder', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-logo-teal/40 outline-none transition"
                    placeholder="e.g., Enter your answer"
                  />
                </div>
              )}

              {/* Help Text */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Help Text</label>
                <input
                  value={form.helpText}
                  onChange={e => update('helpText', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-logo-teal/40 outline-none transition"
                  placeholder="Hint shown below the field"
                />
              </div>

              {/* Required Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Required</p>
                  <p className="text-xs text-slate-400">Respondent must answer this</p>
                </div>
                <button
                  type="button"
                  onClick={() => update('required', !form.required)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.required ? 'bg-logo-teal' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${form.required ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Options for choice fields */}
              {isChoice && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Options</label>
                    <button type="button" onClick={addOption} className="flex items-center gap-1 text-xs text-logo-teal hover:text-logo-navy transition font-medium">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(form.options || []).map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                        <input
                          value={opt.label}
                          onChange={e => updateOption(i, 'label', e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-logo-teal/40 outline-none"
                          placeholder={`Option ${i + 1}`}
                        />
                        <button type="button" onClick={() => removeOption(i)} className="p-1 text-slate-400 hover:text-red-500 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {(!form.options || form.options.length === 0) && (
                      <p className="text-xs text-slate-400 italic">No options yet. Click + Add to add options.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Validation Rules */}
              {hasValidation && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Validation</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['short_text', 'long_text'].includes(field.fieldType) && (
                      <>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Min Length</label>
                          <input type="number" min="0"
                            value={form.validationRules?.minLength || ''}
                            onChange={e => updateValidation('minLength', e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-logo-teal/40" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Max Length</label>
                          <input type="number" min="0"
                            value={form.validationRules?.maxLength || ''}
                            onChange={e => updateValidation('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-logo-teal/40" />
                        </div>
                      </>
                    )}
                    {field.fieldType === 'number' && (
                      <>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Min Value</label>
                          <input type="number"
                            value={form.validationRules?.min ?? ''}
                            onChange={e => updateValidation('min', e.target.value !== '' ? parseFloat(e.target.value) : undefined)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-logo-teal/40" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Max Value</label>
                          <input type="number"
                            value={form.validationRules?.max ?? ''}
                            onChange={e => updateValidation('max', e.target.value !== '' ? parseFloat(e.target.value) : undefined)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-logo-teal/40" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 py-2.5 px-4 rounded-xl bg-logo-teal text-white text-sm font-semibold hover:opacity-90 transition">
            Save Field
          </button>
        </div>
      </div>
    </div>
  );
}
