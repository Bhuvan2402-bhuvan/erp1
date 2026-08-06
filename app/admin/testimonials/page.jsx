'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Quote, GripVertical, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', role: '', dept: '', quote: '', avatar: '', isVisible: true, sortOrder: 0 };

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      // Admin needs all including hidden ones — we'll use the public endpoint but add an all param
      const res = await fetch('/api/testimonials?all=1');
      const data = await res.json();
      setTestimonials(data.testimonials || []);
    } catch {
      toast.error('Failed to load testimonials');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTestimonials(); }, [fetchTestimonials]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };
  const openEdit = (t) => {
    setForm({ name: t.name, role: t.role, dept: t.dept, quote: t.quote, avatar: t.avatar, isVisible: t.isVisible, sortOrder: t.sortOrder });
    setEditingId(t.id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.name || !form.role || !form.dept || !form.quote) {
      toast.error('Name, Role, Department and Quote are required');
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/testimonials/${editingId}` : '/api/testimonials';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingId ? 'Testimonial updated' : 'Testimonial created');
        closeForm();
        fetchTestimonials();
      } else {
        toast.error(data.message || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save testimonial');
    }
    setSaving(false);
  };

  const toggleVisibility = async (t) => {
    const res = await fetch(`/api/testimonials/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisible: !t.isVisible })
    });
    if (res.ok) {
      toast.success(t.isVisible ? 'Hidden from homepage' : 'Now visible on homepage');
      fetchTestimonials();
    } else {
      toast.error('Failed to update visibility');
    }
  };

  const handleDelete = async (t) => {
    if (!confirm(`Delete testimonial from "${t.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/testimonials/${t.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Testimonial deleted');
      fetchTestimonials();
    } else {
      toast.error('Failed to delete');
    }
  };

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';
  const inputClass = 'w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-logo-teal/50 transition';
  const labelClass = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Testimonials</h2>
          <p className="text-slate-500 text-sm mt-1">Manage reviews displayed on the public homepage.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-xl hover:opacity-90 transition text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Review
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className={`${cardClass} p-6 space-y-4 border-logo-teal/40 ring-2 ring-logo-teal/20`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Quote className="w-4 h-4 text-logo-teal" />
              {editingId ? 'Edit Testimonial' : 'New Testimonial'}
            </h3>
            <button onClick={closeForm} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input className={inputClass} placeholder="e.g. Ananya Rao" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Role / Title *</label>
              <input className={inputClass} placeholder="e.g. Student Coordinator" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Department *</label>
              <input className={inputClass} placeholder="e.g. CSE Dept" value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Avatar Initials (auto-generated if blank)</label>
              <input className={inputClass} maxLength={2} placeholder="e.g. AR" value={form.avatar} onChange={e => setForm(f => ({ ...f, avatar: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label className={labelClass}>Sort Order (lower = first)</label>
              <input type="number" className={inputClass} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={form.isVisible} onChange={e => setForm(f => ({ ...f, isVisible: e.target.checked }))} />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-logo-teal"></div>
                <span className="ms-3 text-sm font-medium text-slate-600 dark:text-slate-300">Visible on homepage</span>
              </label>
            </div>
          </div>

          <div>
            <label className={labelClass}>Quote / Review *</label>
            <textarea
              className={`${inputClass} min-h-[100px] resize-y`}
              placeholder="Write the testimonial quote here..."
              value={form.quote}
              onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={closeForm} className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition font-medium">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm rounded-xl bg-gradient-to-r from-logo-navy to-logo-teal text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {saving ? 'Saving...' : <><Check className="w-4 h-4" /> {editingId ? 'Update' : 'Publish'}</>}
            </button>
          </div>
        </div>
      )}

      {/* Testimonials List */}
      <div className={`${cardClass} overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading testimonials...</div>
        ) : testimonials.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Quote className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto" />
            <p className="text-slate-400 font-medium">No testimonials yet</p>
            <p className="text-slate-400 text-sm">Click &ldquo;Add Review&rdquo; to post the first testimonial on the homepage.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {testimonials.map(t => (
              <div key={t.id} className={`p-5 flex items-start gap-4 group transition ${!t.isVisible ? 'opacity-50' : ''}`}>
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-logo-navy to-logo-teal flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {t.avatar}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t.name}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{t.role}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-400">{t.dept}</span>
                    {!t.isVisible && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 text-[10px] font-medium">Hidden</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic line-clamp-2">&ldquo;{t.quote}&rdquo;</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => toggleVisibility(t)}
                    title={t.isVisible ? 'Hide from homepage' : 'Show on homepage'}
                    className={`p-1.5 rounded-lg transition ${t.isVisible ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {t.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    title="Edit"
                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    title="Delete"
                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info note */}
      <p className="text-xs text-slate-400 text-center">
        Only <span className="font-semibold text-emerald-600">visible</span> testimonials appear in the &ldquo;User Experiences&rdquo; section on the public homepage.
        Use the eye icon to toggle visibility without deleting.
      </p>
    </div>
  );
}
