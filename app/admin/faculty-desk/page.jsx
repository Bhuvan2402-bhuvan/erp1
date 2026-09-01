'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Eye, EyeOff, Award, UserCheck, Check, X, Shield, Star, Upload, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '',
  role: 'NSS_PO',
  designation: '',
  branch: '',
  foreword: '',
  achievements: [''],
  photoUrl: '',
  sortOrder: 0,
  isVisible: true,
};

export default function AdminFacultyDesk() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/faculty-desk?all=1');
      const data = await res.json();
      setProfiles(data.profiles || []);
    } catch {
      toast.error('Failed to load faculty desk profiles');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };
  
  const openEdit = (p) => {
    setForm({
      name: p.name || '',
      role: p.role || 'NSS_PO',
      designation: p.designation || '',
      branch: p.branch || '',
      foreword: p.foreword || '',
      achievements: Array.isArray(p.achievements) && p.achievements.length > 0 ? [...p.achievements] : [''],
      photoUrl: p.photoUrl || '',
      sortOrder: p.sortOrder || 0,
      isVisible: p.isVisible !== false,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setForm(f => ({ ...f, photoUrl: dataUrl }));
        toast.success('Picture selected from device!');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleAchievementChange = (index, value) => {
    const newAch = [...form.achievements];
    newAch[index] = value;
    setForm(f => ({ ...f, achievements: newAch }));
  };

  const addAchievementField = () => {
    setForm(f => ({ ...f, achievements: [...f.achievements, ''] }));
  };

  const removeAchievementField = (index) => {
    setForm(f => ({ ...f, achievements: f.achievements.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    if (!form.name || !form.designation || !form.branch || !form.foreword) {
      toast.error('Name, Designation, Branch and Foreword are required');
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/faculty-desk/${editingId}` : '/api/faculty-desk';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          achievements: form.achievements.filter(a => a.trim().length > 0)
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingId ? 'Profile updated' : 'Profile added to Faculty Desk');
        closeForm();
        fetchProfiles();
      } else {
        toast.error(data.message || 'Failed to save profile');
      }
    } catch {
      toast.error('Error saving faculty desk profile');
    }
    setSaving(false);
  };

  const toggleVisibility = async (p) => {
    const res = await fetch(`/api/faculty-desk/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisible: !p.isVisible })
    });
    if (res.ok) {
      toast.success(p.isVisible ? 'Hidden from visitor page' : 'Now visible on visitor page');
      fetchProfiles();
    } else {
      toast.error('Failed to update visibility');
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Delete profile for "${p.name}"? This action cannot be undone.`)) return;
    const res = await fetch(`/api/faculty-desk/${p.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Profile deleted');
      fetchProfiles();
    } else {
      toast.error('Failed to delete profile');
    }
  };

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';
  const inputClass = 'w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-logo-teal/50 transition';
  const labelClass = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">NSS Faculty Desk</h2>
          <p className="text-slate-500 text-sm mt-1">Manage Program Officers (POs) & Program Coordinator (PC) profiles & forewords for the visitor page.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-xl hover:opacity-90 transition text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Faculty Desk Profile
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className={`${cardClass} p-6 space-y-4 border-logo-teal/40 ring-2 ring-logo-teal/20`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-logo-teal" />
              {editingId ? 'Edit Faculty Desk Profile' : 'New Faculty Desk Profile'}
            </h3>
            <button onClick={closeForm} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Faculty Name *</label>
              <input className={inputClass} placeholder="e.g. Dr. K. Srinivasan" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div>
              <label className={labelClass}>Desk Designation / Role *</label>
              <select className={inputClass} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="NSS_PO">NSS Program Officer (PO)</option>
                <option value="NSS_PC">NSS Program Coordinator (PC - Main)</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Designation *</label>
              <input className={inputClass} placeholder="e.g. Associate Professor & NSS PO" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} />
            </div>

            <div>
              <label className={labelClass}>Branch / Department *</label>
              <input className={inputClass} placeholder="e.g. CSE Department" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className={labelClass}>Faculty Profile Picture</label>
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                {form.photoUrl ? (
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-logo-teal shadow-sm shrink-0 bg-slate-200 dark:bg-slate-800">
                    <Image src={form.photoUrl} alt="Preview" width={80} height={80} className="w-full h-full object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, photoUrl: '' }))}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-xs"
                      title="Remove Photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 shrink-0">
                    <Camera className="w-6 h-6 mb-1 text-slate-400" />
                    <span className="text-[10px] font-semibold">No Photo</span>
                  </div>
                )}

                <div className="flex-1 w-full space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor="faculty-device-photo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-xl text-xs font-bold transition shadow-sm hover:opacity-90"
                    >
                      <Upload className="w-4 h-4" /> Choose File from Device
                    </label>
                    <input
                      id="faculty-device-photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    {form.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, photoUrl: '' }))}
                        className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">Supports JPG, PNG, WEBP. Automatically optimized.</p>
                  <div>
                    <input
                      className={inputClass}
                      placeholder="Or paste direct image URL (https://...)"
                      value={form.photoUrl}
                      onChange={e => setForm(f => ({ ...f, photoUrl: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Foreword / Message / Words from Desk *</label>
              <textarea
                className={`${inputClass} min-h-[110px] resize-y`}
                placeholder="Write the foreword or inspirational message here..."
                value={form.foreword}
                onChange={e => setForm(f => ({ ...f, foreword: e.target.value }))}
              />
            </div>

            {/* Achievements List */}
            <div className="sm:col-span-2 space-y-2">
              <label className={labelClass}>Achievements & Special Recognition</label>
              {form.achievements.map((ach, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    className={inputClass}
                    placeholder={`Achievement ${idx + 1} (e.g. State Best NSS Unit Award 2025)`}
                    value={ach}
                    onChange={e => handleAchievementChange(idx, e.target.value)}
                  />
                  {form.achievements.length > 1 && (
                    <button type="button" onClick={() => removeAchievementField(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addAchievementField} className="text-xs text-logo-teal font-semibold hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add another achievement
              </button>
            </div>

            <div>
              <label className={labelClass}>Sort Order (lower = first)</label>
              <input type="number" className={inputClass} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
            </div>

            <div className="flex items-center gap-3 pt-5">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={form.isVisible} onChange={e => setForm(f => ({ ...f, isVisible: e.target.checked }))} />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-logo-teal"></div>
                <span className="ms-3 text-sm font-medium text-slate-600 dark:text-slate-300">Visible on Visitor Page</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={closeForm} className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition font-medium">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm rounded-xl bg-gradient-to-r from-logo-navy to-logo-teal text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {saving ? 'Saving...' : <><Check className="w-4 h-4" /> {editingId ? 'Update Profile' : 'Publish Profile'}</>}
            </button>
          </div>
        </div>
      )}

      {/* Profiles List */}
      <div className={`${cardClass} overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading Faculty Desk...</div>
        ) : profiles.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Shield className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto" />
            <p className="text-slate-400 font-medium">No faculty desk profiles added yet</p>
            <p className="text-slate-400 text-sm">Click &ldquo;Add Faculty Desk Profile&rdquo; to post Program Officer (PO) & Coordinator (PC) forewords.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {profiles.map(p => (
              <div key={p.id} className={`p-5 flex flex-col md:flex-row items-start justify-between gap-4 group transition ${!p.isVisible ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Photo Avatar */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-logo-navy to-logo-teal text-white flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden shadow-sm">
                    {p.photoUrl ? (
                      <Image src={p.photoUrl} alt={p.name} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                    ) : (
                      p.name ? p.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : 'FC'
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-base">{p.name}</span>
                      {p.role === 'NSS_PC' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-extrabold flex items-center gap-1 border border-purple-200">
                          <Star className="w-3 h-3 fill-current" /> Main NSS PC
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                          NSS PO
                        </span>
                      )}
                      {!p.isVisible && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 text-[10px] font-medium">Hidden</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{p.designation} &bull; {p.branch}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 italic line-clamp-2 mt-1">&ldquo;{p.foreword}&rdquo;</p>
                    
                    {Array.isArray(p.achievements) && p.achievements.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {p.achievements.map((ach, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 rounded-md text-[11px]">
                            <Award className="w-3 h-3 text-amber-500" /> {ach}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 self-end md:self-start opacity-100 md:opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => toggleVisibility(p)}
                    title={p.isVisible ? 'Hide from visitor page' : 'Show on visitor page'}
                    className={`p-1.5 rounded-lg transition ${p.isVisible ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {p.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    title="Edit Profile"
                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    title="Delete Profile"
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
    </div>
  );
}
