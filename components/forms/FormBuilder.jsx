'use client';
import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Settings, Trash2, Plus, Eye, EyeOff, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import FieldTypeSelector from './FieldTypeSelector';
import FieldConfigPanel from './FieldConfigPanel';

// ── Field preview renderer ───────────────────────────────────────────────────

function FieldPreviewInner({ field }) {
  const ft = field.fieldType;
  const opts = field.options || [];

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-sm text-slate-400 cursor-not-allowed';

  if (ft === 'section') return <div className="h-px bg-gradient-to-r from-logo-navy to-logo-teal" />;
  if (ft === 'divider') return <hr className="border-slate-200 dark:border-slate-700" />;
  if (ft === 'heading') return <h3 className="text-lg font-bold text-slate-800 dark:text-white">{field.label}</h3>;
  if (ft === 'description') return <p className="text-sm text-slate-500 dark:text-slate-400">{field.label}</p>;

  if (['short_text', 'email', 'phone', 'url', 'number'].includes(ft)) {
    return <input disabled className={inputCls} placeholder={field.placeholder || field.label} />;
  }
  if (ft === 'long_text') {
    return <textarea disabled rows={3} className={`${inputCls} resize-none`} placeholder={field.placeholder || field.label} />;
  }
  if (ft === 'date' || ft === 'time' || ft === 'datetime') {
    return <input type={ft === 'datetime' ? 'datetime-local' : ft} disabled className={inputCls} />;
  }
  if (ft === 'dropdown') {
    return (
      <select disabled className={inputCls}>
        <option>{field.placeholder || 'Select an option'}</option>
        {opts.map((o, i) => <option key={i}>{o.label}</option>)}
      </select>
    );
  }
  if (ft === 'radio' || ft === 'yes_no') {
    const radioOpts = ft === 'yes_no' ? [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] : opts;
    return (
      <div className="space-y-1.5">
        {radioOpts.map((o, i) => (
          <label key={i} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed">
            <input type="radio" disabled className="accent-logo-teal" /> {o.label}
          </label>
        ))}
      </div>
    );
  }
  if (ft === 'checkbox' || ft === 'multi_select') {
    return (
      <div className="space-y-1.5">
        {opts.map((o, i) => (
          <label key={i} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed">
            <input type="checkbox" disabled className="accent-logo-teal" /> {o.label}
          </label>
        ))}
      </div>
    );
  }
  if (ft === 'rating') {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => <span key={n} className="text-2xl text-slate-200 dark:text-slate-700">★</span>)}
      </div>
    );
  }
  if (ft === 'linear_scale') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">1</span>
        <div className="flex gap-1 flex-1 justify-between">
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button key={n} disabled className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 text-xs text-slate-400">{n}</button>
          ))}
        </div>
        <span className="text-xs text-slate-400">10</span>
      </div>
    );
  }
  if (ft === 'file_upload' || ft === 'image_upload') {
    return (
      <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center text-sm text-slate-400">
        {ft === 'image_upload' ? '🖼 Click to upload image' : '📎 Click to upload file'}
      </div>
    );
  }
  if (ft === 'signature') {
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl h-20 flex items-center justify-center text-sm text-slate-400 bg-slate-50 dark:bg-slate-800">
        ✍ Signature field
      </div>
    );
  }

  return <input disabled className={inputCls} placeholder={field.placeholder || field.label} />;
}

// ── Sortable field item ───────────────────────────────────────────────────────

function SortableFieldItem({ field, onConfig, onDelete, isCollapsed, onToggleCollapse }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  const isLayout = ['section', 'heading', 'description', 'divider'].includes(field.fieldType);

  return (
    <div ref={setNodeRef} style={style} className={`group bg-white dark:bg-slate-800 rounded-2xl border transition-all ${
      isDragging ? 'border-logo-teal shadow-lg' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
    }`}>
      <div className="flex items-center gap-3 p-4">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Field info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
              {field.label || <span className="text-slate-400 italic">Untitled field</span>}
            </span>
            {field.required && !isLayout && (
              <span className="shrink-0 text-red-500 text-xs font-bold">*</span>
            )}
            <span className="shrink-0 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              {field.fieldType.replace(/_/g, ' ')}
            </span>
          </div>
          {field.description && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">{field.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition">
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button type="button" onClick={onConfig}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-logo-teal transition">
            <Settings className="w-4 h-4" />
          </button>
          <button type="button" onClick={onDelete}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-700/50">
          <div className="mt-3">
            <FieldPreviewInner field={field} />
            {field.helpText && <p className="text-xs text-slate-400 mt-1.5">{field.helpText}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main FormBuilder ─────────────────────────────────────────────────────────

export default function FormBuilder({ formId, initialFields = [], onChange }) {
  const [fields, setFields] = useState(initialFields);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [configField, setConfigField] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const addField = useCallback(async (fieldType) => {
    setShowTypeSelector(false);
    const defaultLabel = fieldType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    setSaving(true);
    try {
      const res = await fetch(`/api/forms/${formId}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldType, label: defaultLabel, required: false, sortOrder: fields.length }),
      });
      if (!res.ok) throw new Error('Failed to add field');
      const { field } = await res.json();
      const newFields = [...fields, field];
      setFields(newFields);
      onChange?.(newFields);
      // Auto-open config for content fields
      if (!['divider', 'section'].includes(fieldType)) {
        setConfigField(field);
      }
    } catch (e) {
      toast.error('Failed to add field');
    } finally {
      setSaving(false);
    }
  }, [fields, formId, onChange]);

  const handleConfig = useCallback(async (updatedData) => {
    if (!configField) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/forms/${formId}/fields/${configField.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) throw new Error('Failed to update field');
      const { field: updated } = await res.json();
      const newFields = fields.map(f => f.id === updated.id ? updated : f);
      setFields(newFields);
      onChange?.(newFields);
      setConfigField(null);
      toast.success('Field updated');
    } catch (e) {
      toast.error('Failed to update field');
    } finally {
      setSaving(false);
    }
  }, [configField, fields, formId, onChange]);

  const handleDelete = useCallback(async (field) => {
    if (!confirm(`Delete field "${field.label || 'this field'}"?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/forms/${formId}/fields/${field.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete field');
      const newFields = fields.filter(f => f.id !== field.id);
      setFields(newFields);
      onChange?.(newFields);
      toast.success('Field removed');
    } catch (e) {
      toast.error('Failed to remove field');
    } finally {
      setSaving(false);
    }
  }, [fields, formId, onChange]);

  const handleDragEnd = useCallback(async ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex(f => f.id === active.id);
    const newIndex = fields.findIndex(f => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(fields, oldIndex, newIndex);
    setFields(reordered);
    onChange?.(reordered);

    // Persist reorder
    try {
      await fetch(`/api/forms/${formId}/fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: reordered.map(f => f.id) }),
      });
    } catch (e) {
      toast.error('Failed to save order');
    }
  }, [fields, formId, onChange]);

  const toggleCollapse = (id) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  const collapseAll = () => setCollapsed(fields.reduce((acc, f) => ({ ...acc, [f.id]: true }), {}));
  const expandAll = () => setCollapsed({});

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {fields.length} field{fields.length !== 1 ? 's' : ''} · Drag to reorder
        </p>
        <div className="flex items-center gap-2">
          {fields.length > 0 && (
            <>
              <button type="button" onClick={collapseAll}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition px-2 py-1">
                <EyeOff className="w-3.5 h-3.5" /> Collapse all
              </button>
              <button type="button" onClick={expandAll}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition px-2 py-1">
                <Eye className="w-3.5 h-3.5" /> Expand all
              </button>
            </>
          )}
        </div>
      </div>

      {/* DnD Field List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {fields.map(field => (
              <SortableFieldItem
                key={field.id}
                field={field}
                isCollapsed={!!collapsed[field.id]}
                onToggleCollapse={() => toggleCollapse(field.id)}
                onConfig={() => setConfigField(field)}
                onDelete={() => handleDelete(field)}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-logo-teal shadow-2xl p-4 opacity-80">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {fields.find(f => f.id === activeId)?.label || 'Moving field…'}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty state */}
      {fields.length === 0 && (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="w-14 h-14 bg-logo-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Plus className="w-7 h-7 text-logo-teal" />
          </div>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">No fields yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Add your first field to start building the form</p>
        </div>
      )}

      {/* Add Field Button */}
      <button
        type="button"
        disabled={saving}
        onClick={() => setShowTypeSelector(prev => !prev)}
        className="w-full py-3 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-logo-teal dark:hover:border-logo-teal rounded-2xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-logo-teal transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Plus className="w-4 h-4" />
        {showTypeSelector ? 'Hide field types' : 'Add Field'}
      </button>

      {/* Field Type Selector */}
      {showTypeSelector && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Choose a field type</p>
          <FieldTypeSelector onSelect={addField} />
        </div>
      )}

      {/* Field Config Drawer */}
      {configField && (
        <FieldConfigPanel
          field={configField}
          onSave={handleConfig}
          onClose={() => setConfigField(null)}
        />
      )}
    </div>
  );
}
