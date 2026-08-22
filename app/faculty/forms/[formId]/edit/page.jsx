'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Globe, Lock, Archive, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import FormBuilder from '@/components/forms/FormBuilder';

const TABS = ['basic', 'fields', 'settings'];

export default function EditFormPage() {
  const { formId } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const baseHref = pathname.startsWith('/admin/forms')
    ? '/admin/forms'
    : pathname.startsWith('/student/forms')
    ? '/student/forms'
    : '/faculty/forms';

  const [tab, setTab] = useState('fields');
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [deptSearch, setDeptSearch] = useState('');
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [meta, setMeta] = useState({});
  const updateMeta = (k, v) => setMeta(prev => ({ ...prev, [k]: v }));

  const toggleSelectedDept = (dId) => {
    setMeta(prev => {
      const current = prev.selectedDepartmentIds || [];
      const exists = current.includes(dId);
      const updated = exists ? current.filter(id => id !== dId) : [...current, dId];
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
      const updated = exists ? current.filter(id => id !== uId) : [...current, uId];
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

    fetch(`/api/forms/${formId}`).then(r => r.json()).then(d => {
      if (d.form) {
        setForm(d.form);
        const accessDeptIds = (d.form.access || []).map(a => a.departmentId).filter(Boolean);
        const accessUserIds = (d.form.access || []).map(a => a.userId).filter(Boolean);
        setMeta({
          title: d.form.title,
          description: d.form.description || '',
          category: d.form.category || 'General',
          instructions: d.form.instructions || '',
          visibility: d.form.visibility,
          selectedDepartmentIds: accessDeptIds,
          selectedUserIds: accessUserIds,
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
        body: JSON.stringify({
          ...meta,
          maxResponses: meta.maxResponses ? parseInt(meta.maxResponses) : null,
          selectedDepartmentIds: meta.selectedDepartmentIds || [],
          selectedUserIds: meta.selectedUserIds || []
        }),
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
      router.push(`${baseHref}/published`);
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
      router.push(`${baseHref}/closed`);
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
      router.push(baseHref);
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
      <Link href={baseHref} className="text-logo-teal mt-2 inline-block">Back to forms</Link>
    </div>
  );

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-sm focus:ring-2 focus:ring-logo-teal/40 focus:border-logo-teal outline-none transition text-slate-800 dark:text-slate-100';
  const labelCls = 'block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href={baseHref} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition">
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
          <Link href={`${baseHref}/${formId}/responses`}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            Responses
          </Link>
          <Link href={`${baseHref}/${formId}/analytics`}
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

          {/* Visibility Helper & Department Selection */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {meta.visibility === 'DEPARTMENT_ONLY' && '🔒 Visible only to volunteers & faculty belonging to host department.'}
              {meta.visibility === 'ALL_VOLUNTEERS' && '🌐 Visible to all registered volunteers across all college departments.'}
              {meta.visibility === 'INTERNAL_DEPT' && '💼 Internal Department Form: Visible ONLY to Faculty Members and Student Coordinators of host department.'}
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
                    const filtered = assignableUsers.filter(u => {
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
                          {assignableUsers.length === 0 ? 'No registered users found in system.' : 'No users match your search / filter criteria.'}
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
