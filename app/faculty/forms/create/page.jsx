'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const baseHref = pathname.startsWith('/admin/forms')
    ? '/admin/forms'
    : pathname.startsWith('/student/forms')
    ? '/student/forms'
    : '/faculty/forms';

  const [tab, setTab] = useState('basic');
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [formId, setFormId] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [deptSearch, setDeptSearch] = useState('');
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  const [meta, setMeta] = useState({
    title: '',
    description: '',
    category: 'General',
    instructions: '',
    visibility: 'DEPARTMENT_ONLY',
    departmentId: '',
    selectedDepartmentIds: [],
    selectedUserIds: [],
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

  const toggleSelectedDept = (dId) => {
    setMeta(prev => {
      const exists = prev.selectedDepartmentIds.includes(dId);
      const updated = exists
        ? prev.selectedDepartmentIds.filter(id => id !== dId)
        : [...prev.selectedDepartmentIds, dId];
      return { ...prev, selectedDepartmentIds: updated };
    });
  };

  const selectAllDepts = () => {
    setMeta(prev => ({ ...prev, selectedDepartmentIds: departments.map(d => d.id) }));
  };

  const clearAllDepts = () => {
    setMeta(prev => ({ ...prev, selectedDepartmentIds: [] }));
  };

  const toggleSelectedUser = (uId) => {
    setMeta(prev => {
      const current = prev.selectedUserIds || [];
      const exists = current.includes(uId);
      const updated = exists
        ? current.filter(id => id !== uId)
        : [...current, uId];
      return { ...prev, selectedUserIds: updated };
    });
  };

  useEffect(() => {
    fetch('/api/departments').then(r => r.json()).then(d => {
      if (d.departments) setDepartments(d.departments);
    }).catch(() => {});

    setLoadingUsers(true);
    fetch('/api/users').then(r => r.json()).then(d => {
      if (d.users) setAssignableUsers(d.users);
    }).catch(() => {}).finally(() => setLoadingUsers(false));
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
      router.push(`${baseHref}/published`);
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
          <Link href={baseHref} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition">
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
              <label className={labelCls}>Target Audience / Visibility</label>
              <select value={meta.visibility} onChange={e => updateMeta('visibility', e.target.value)} className={inputCls}>
                <option value="DEPARTMENT_ONLY">Department Volunteers (Host Department)</option>
                <option value="ALL_VOLUNTEERS">All Volunteers (Global Access)</option>
                <option value="INTERNAL_DEPT">Internal Department Form (Faculty & Coordinators Only)</option>
                <option value="FACULTY_ONLY">Faculty Members Only</option>
                <option value="COORDINATORS_ONLY">Student Coordinators Only</option>
                <option value="ADMIN_ONLY">Lead Admins Only</option>
                <option value="SELECTED_DEPARTMENTS">Selected Departments (Custom Access)</option>
                <option value="SELECTED_USERS">Selected Users Only</option>
              </select>
            </div>
          </div>

          {/* Visibility Info & Department Selection */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {meta.visibility === 'DEPARTMENT_ONLY' && '🔒 Visible only to volunteers & faculty belonging to your host department.'}
              {meta.visibility === 'ALL_VOLUNTEERS' && '🌐 Visible to all registered volunteers across all college departments.'}
              {meta.visibility === 'INTERNAL_DEPT' && '💼 Internal Department Form: Visible ONLY to Faculty Members and Student Coordinators of your department.'}
              {meta.visibility === 'FACULTY_ONLY' && '👨‍🏫 Restricted to Faculty Members only.'}
              {meta.visibility === 'COORDINATORS_ONLY' && '⭐ Restricted to Student Coordinators only.'}
              {meta.visibility === 'ADMIN_ONLY' && '🛡️ Restricted to Lead Admins only.'}
              {meta.visibility === 'SELECTED_DEPARTMENTS' && '🏛️ Visible only to volunteers in the specific departments selected below.'}
              {meta.visibility === 'SELECTED_USERS' && '👤 Restricted to specifically targeted users.'}
            </p>

            {meta.visibility === 'SELECTED_DEPARTMENTS' && (
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Select Target Departments ({(meta.selectedDepartmentIds || []).length} of {departments.length} selected)
                  </label>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={selectAllDepts}
                      className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold transition"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearAllDepts}
                      className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold transition"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={deptSearch}
                  onChange={e => setDeptSearch(e.target.value)}
                  placeholder="Filter departments by name or code..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-logo-teal"
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                  {departments
                    .filter(d => !deptSearch || d.name.toLowerCase().includes(deptSearch.toLowerCase()) || d.code.toLowerCase().includes(deptSearch.toLowerCase()))
                    .map(d => {
                      const isChecked = (meta.selectedDepartmentIds || []).includes(d.id);
                      return (
                        <label
                          key={d.id}
                          onClick={() => toggleSelectedDept(d.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                            isChecked
                              ? 'bg-logo-teal/10 border-logo-teal text-logo-teal dark:text-teal-300'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded text-logo-teal focus:ring-logo-teal"
                            />
                            <span className="truncate">{d.name}</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 shrink-0 ml-1">
                            {d.code}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}

            {meta.visibility === 'SELECTED_USERS' && (
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Assign Specific Users ({(meta.selectedUserIds || []).length} assigned)
                  </label>
                  <div className="flex gap-1 text-[11px] font-semibold overflow-x-auto">
                    {[
                      { key: 'ALL', label: 'All Users' },
                      { key: 'FACULTY', label: 'Faculty' },
                      { key: 'COORDINATOR', label: 'Coordinators' },
                      { key: 'VOLUNTEER', label: 'Volunteers' },
                      { key: 'ADMIN', label: 'Admins' },
                    ].map(r => (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setUserRoleFilter(r.key)}
                        className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                          userRoleFilter === r.key
                            ? 'bg-logo-teal text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by name, email, or department code..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-logo-teal"
                />

                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 dark:border-slate-700/60 rounded-xl p-2 bg-white dark:bg-slate-800">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-500">
                      <span className="w-4 h-4 border-2 border-logo-teal border-t-transparent rounded-full animate-spin"></span>
                      <span>Loading user directory...</span>
                    </div>
                  ) : (() => {
                    const filtered = (assignableUsers || []).filter(u => {
                      const searchLower = userSearch.toLowerCase();
                      const matchesSearch = !userSearch ||
                        u.name?.toLowerCase().includes(searchLower) ||
                        u.email?.toLowerCase().includes(searchLower) ||
                        u.department?.code?.toLowerCase().includes(searchLower) ||
                        u.department?.name?.toLowerCase().includes(searchLower);

                      const isFac = u.role === 'FACULTY' || !!u.faculty;
                      const isCoord = u.role === 'STUDENT' && !!u.student?.isCoordinator;
                      const isAdmin = u.role === 'ADMIN';

                      if (userRoleFilter === 'FACULTY') return matchesSearch && isFac;
                      if (userRoleFilter === 'COORDINATOR') return matchesSearch && isCoord;
                      if (userRoleFilter === 'ADMIN') return matchesSearch && isAdmin;
                      if (userRoleFilter === 'VOLUNTEER') return matchesSearch && u.role === 'STUDENT' && !isCoord;

                      return matchesSearch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <p className="text-center py-6 text-xs text-slate-400">
                          {(assignableUsers || []).length === 0 ? 'No registered users found in system.' : 'No users match your search / filter criteria.'}
                        </p>
                      );
                    }

                    return filtered.map(u => {
                      const isChecked = (meta.selectedUserIds || []).includes(u.id);
                      const isFac = u.role === 'FACULTY' || !!u.faculty;
                      const isCoord = u.role === 'STUDENT' && !!u.student?.isCoordinator;
                      const isAdmin = u.role === 'ADMIN';

                      const badgeText = isAdmin ? 'Lead Admin' : isFac ? 'Faculty' : isCoord ? 'Coordinator' : 'Volunteer';
                      const badgeCls = isAdmin
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                        : isFac
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                        : isCoord
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300';

                      const deptCode = u.department?.code || u.student?.department?.code || u.faculty?.department?.code;

                      return (
                        <label
                          key={u.id}
                          onClick={() => toggleSelectedUser(u.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                            isChecked
                              ? 'bg-logo-teal/10 border-logo-teal text-logo-teal dark:text-teal-300'
                              : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded text-logo-teal focus:ring-logo-teal"
                            />
                            <div className="truncate">
                              <p className="font-semibold text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {deptCode && (
                                  <span className="text-[10px] font-normal text-slate-400">({deptCode})</span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 ${badgeCls}`}>
                            {badgeText}
                          </span>
                        </label>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
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
