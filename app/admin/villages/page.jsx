'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, MapPin, Pencil, Trash2, Eye, Check, X, ChevronDown, ChevronUp, Users, Calendar, FileText, MessageSquare, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'INACTIVE', label: 'Inactive', color: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' },
];

const EMPTY_FORM = {
  name: '',
  district: '',
  description: '',
  departmentId: '',
  facultyId: '',
  adoptedDate: new Date().toISOString().split('T')[0],
  status: 'ACTIVE',
};

export default function AdminVillages() {
  const [villages, setVillages] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expandedVillage, setExpandedVillage] = useState(null);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reviewingReport, setReviewingReport] = useState(null);
  const [adminRemarks, setAdminRemarks] = useState('');

  const fetchVillages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/villages');
      const data = await res.json();
      setVillages(data.villages || []);
    } catch {
      toast.error('Failed to load villages');
    }
    setLoading(false);
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch {
      console.error('Failed to load departments');
    }
  }, []);

  const fetchFaculty = useCallback(async () => {
    try {
      const res = await fetch('/api/faculty');
      const data = await res.json();
      setFacultyList(data.faculty || []);
    } catch {
      console.error('Failed to load faculty');
    }
  }, []);

  useEffect(() => {
    fetchVillages();
    fetchDepartments();
    fetchFaculty();
  }, [fetchVillages, fetchDepartments, fetchFaculty]);

  const fetchReports = async (villageId) => {
    setLoadingReports(true);
    try {
      const res = await fetch(`/api/villages/${villageId}/reports`);
      const data = await res.json();
      setReports(data.reports || []);
    } catch {
      toast.error('Failed to load reports');
    }
    setLoadingReports(false);
  };

  const toggleExpand = (villageId) => {
    if (expandedVillage === villageId) {
      setExpandedVillage(null);
      setReports([]);
    } else {
      setExpandedVillage(villageId);
      fetchReports(villageId);
    }
  };

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };

  const openEdit = (v) => {
    setForm({
      name: v.name || '',
      district: v.district || '',
      description: v.description || '',
      departmentId: v.departmentId || '',
      facultyId: v.facultyId || '',
      adoptedDate: v.adoptedDate ? new Date(v.adoptedDate).toISOString().split('T')[0] : '',
      status: v.status || 'ACTIVE',
    });
    setEditingId(v.id);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.name || !form.district || !form.departmentId || !form.facultyId) {
      toast.error('Village name, district, department, and faculty are required');
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/villages/${editingId}` : '/api/villages';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingId ? 'Village updated' : 'Village assigned successfully');
        closeForm();
        fetchVillages();
      } else {
        toast.error(data.message || 'Failed to save');
      }
    } catch {
      toast.error('Error saving village');
    }
    setSaving(false);
  };

  const handleDelete = async (v) => {
    if (!confirm(`Delete village "${v.name}"? All weekly reports will also be deleted.`)) return;
    const res = await fetch(`/api/villages/${v.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Village deleted');
      if (expandedVillage === v.id) setExpandedVillage(null);
      fetchVillages();
    } else {
      toast.error('Failed to delete village');
    }
  };

  const handleStatusChange = async (v, newStatus) => {
    const res = await fetch(`/api/villages/${v.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      toast.success(`Village marked as ${newStatus.toLowerCase()}`);
      fetchVillages();
    } else {
      toast.error('Failed to update status');
    }
  };

  const handleReviewReport = async (reportId) => {
    if (!adminRemarks.trim()) {
      toast.error('Please enter review remarks');
      return;
    }
    const res = await fetch(`/api/villages/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminRemarks, status: 'REVIEWED' })
    });
    if (res.ok) {
      toast.success('Report reviewed');
      setReviewingReport(null);
      setAdminRemarks('');
      fetchReports(expandedVillage);
    } else {
      toast.error('Failed to review report');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Delete this report?')) return;
    const res = await fetch(`/api/villages/reports/${reportId}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Report deleted');
      fetchReports(expandedVillage);
    } else {
      toast.error('Failed to delete report');
    }
  };

  // Filter faculty by selected department
  const filteredFaculty = form.departmentId
    ? facultyList.filter(f => f.departmentId === form.departmentId)
    : facultyList;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';
  const inputClass = 'w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-logo-teal/50 transition';
  const labelClass = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1';

  const getStatusBadge = (status) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[2];
    return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${opt.color}`}>{opt.label}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="w-7 h-7 text-logo-teal" /> Adopted Villages
          </h2>
          <p className="text-slate-500 text-sm mt-1">Assign villages to NSS units (departments) and track weekly progress from faculty POs.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-xl hover:opacity-90 transition text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" /> Assign Village
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className={`${cardClass} p-6 space-y-4 border-logo-teal/40 ring-2 ring-logo-teal/20`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-logo-teal" />
              {editingId ? 'Edit Village Assignment' : 'Assign New Village'}
            </h3>
            <button onClick={closeForm} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Village Name *</label>
              <input className={inputClass} placeholder="e.g. Pedapudi" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>District / Mandal *</label>
              <input className={inputClass} placeholder="e.g. Guntur, AP" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>NSS Unit (Department) *</label>
              <select className={inputClass} value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value, facultyId: '' }))}>
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Faculty Coordinator (PO) *</label>
              <select className={inputClass} value={form.facultyId} onChange={e => setForm(f => ({ ...f, facultyId: e.target.value }))}>
                <option value="">Select Faculty PO</option>
                {filteredFaculty.map(f => (
                  <option key={f.id} value={f.id}>{f.user?.name || 'Unknown'} ({f.employeeId})</option>
                ))}
              </select>
              {form.departmentId && filteredFaculty.length === 0 && (
                <p className="text-[11px] text-amber-500 mt-1">No faculty found in this department. Showing all faculty below.</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Adoption Date</label>
              <input type="date" className={inputClass} value={form.adoptedDate} onChange={e => setForm(f => ({ ...f, adoptedDate: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Description (Optional)</label>
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                placeholder="Brief description about the village, population, key needs..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={closeForm} className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition font-medium">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm rounded-xl bg-gradient-to-r from-logo-navy to-logo-teal text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {saving ? 'Saving...' : <><Check className="w-4 h-4" /> {editingId ? 'Update Village' : 'Assign Village'}</>}
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {!loading && villages.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Active Villages', count: villages.filter(v => v.status === 'ACTIVE').length, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300' },
            { label: 'Completed', count: villages.filter(v => v.status === 'COMPLETED').length, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300' },
            { label: 'Total Reports', count: villages.reduce((sum, v) => sum + (v._count?.weeklyReports || 0), 0), color: 'text-logo-navy bg-logo-navy/10 dark:bg-logo-teal/20 dark:text-logo-teal' },
          ].map((stat, idx) => (
            <div key={idx} className={`${cardClass} p-4 text-center`}>
              <p className={`text-2xl font-extrabold ${stat.color.split(' ')[0]}`}>{stat.count}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Villages List */}
      <div className={`${cardClass} overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading adopted villages...</div>
        ) : villages.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <MapPin className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto" />
            <p className="text-slate-400 font-medium">No villages assigned yet</p>
            <p className="text-slate-400 text-sm">Click &ldquo;Assign Village&rdquo; to adopt a village for an NSS unit.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {villages.map(v => (
              <div key={v.id}>
                {/* Village Row */}
                <div className="p-5 flex flex-col md:flex-row items-start justify-between gap-4 group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                  <div className="flex items-start gap-4 min-w-0 flex-1 cursor-pointer" onClick={() => toggleExpand(v.id)}>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-logo-green to-logo-teal text-white flex items-center justify-center shrink-0 shadow-sm">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-base">{v.name}</span>
                        {getStatusBadge(v.status)}
                      </div>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <Building2 className="w-3 h-3" /> {v.district}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {v.department?.name || 'N/A'}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(v.adoptedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {v._count?.weeklyReports || 0} reports</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        PO: <span className="font-semibold text-logo-navy dark:text-logo-teal">{v.faculty?.user?.name || 'Unassigned'}</span>
                        {v.faculty?.department && <span className="text-slate-400"> • {v.faculty.department.name}</span>}
                      </p>
                      {v.description && (
                        <p className="text-xs text-slate-400 italic line-clamp-1 mt-0.5">{v.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 self-end md:self-start">
                    <button onClick={() => toggleExpand(v.id)} title="View Reports" className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-500 hover:bg-slate-100 transition">
                      {expandedVillage === v.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <select
                      value={v.status}
                      onChange={(e) => handleStatusChange(v, e.target.value)}
                      className="text-[11px] font-semibold border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 dark:text-white cursor-pointer"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <button onClick={() => openEdit(v)} title="Edit" className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(v)} title="Delete" className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Reports Section */}
                {expandedVillage === v.id && (
                  <div className="bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 px-5 py-4">
                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-logo-teal" /> Weekly Reports for {v.name}
                    </h4>

                    {loadingReports ? (
                      <p className="text-xs text-slate-400 animate-pulse py-3">Loading reports...</p>
                    ) : reports.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3">No weekly reports submitted yet by the faculty coordinator.</p>
                    ) : (
                      <div className="space-y-3">
                        {reports.map(r => (
                          <div key={r.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    Week: {new Date(r.weekStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(r.weekEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                    r.status === 'REVIEWED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                                    r.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                                    'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                  }`}>{r.status}</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300"><strong>Activities:</strong> {r.activitiesDone}</p>
                                <p className="text-[11px] text-slate-400">Volunteers: {r.volunteersInvolved} &bull; By: {r.submittedBy?.name || 'Unknown'}</p>
                                {r.challengesFaced && <p className="text-[11px] text-slate-400"><strong>Challenges:</strong> {r.challengesFaced}</p>}
                                {r.nextWeekPlan && <p className="text-[11px] text-slate-400"><strong>Next Week:</strong> {r.nextWeekPlan}</p>}
                                {r.adminRemarks && (
                                  <div className="mt-2 bg-logo-teal/5 dark:bg-logo-teal/10 rounded-lg p-2.5 border border-logo-teal/20">
                                    <p className="text-[10px] font-extrabold text-logo-teal uppercase mb-0.5">Admin Review</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-300">{r.adminRemarks}</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {r.status !== 'REVIEWED' && (
                                  <button
                                    onClick={() => { setReviewingReport(r.id); setAdminRemarks(r.adminRemarks || ''); }}
                                    title="Review"
                                    className="p-1.5 rounded-lg bg-logo-teal/10 text-logo-teal hover:bg-logo-teal/20 transition"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button onClick={() => handleDeleteReport(r.id)} title="Delete" className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Inline Review Form */}
                            {reviewingReport === r.id && (
                              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
                                <textarea
                                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-logo-teal/50 resize-y min-h-[60px]"
                                  placeholder="Enter your review remarks..."
                                  value={adminRemarks}
                                  onChange={e => setAdminRemarks(e.target.value)}
                                />
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => { setReviewingReport(null); setAdminRemarks(''); }} className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium">Cancel</button>
                                  <button
                                    onClick={() => handleReviewReport(r.id)}
                                    className="px-3 py-1.5 text-xs rounded-lg bg-logo-teal text-white font-semibold hover:opacity-90"
                                  >
                                    <Check className="w-3 h-3 inline mr-1" /> Mark Reviewed
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
