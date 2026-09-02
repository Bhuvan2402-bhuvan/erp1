'use client';
import { useState, useEffect, useCallback } from 'react';
import { MapPin, FileText, Plus, Check, X, Calendar, Users, ChevronDown, ChevronUp, Send, Clock, MessageSquare, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FacultyVillages() {
  const [dbUser, setDbUser] = useState(null);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedVillage, setExpandedVillage] = useState(null);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [showReportForm, setShowReportForm] = useState(null); // villageId or null
  const [submitting, setSubmitting] = useState(false);

  // Get current week boundaries (Monday - Sunday)
  const getWeekBounds = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    };
  };

  const weekBounds = getWeekBounds();

  const [reportForm, setReportForm] = useState({
    weekStartDate: weekBounds.start,
    weekEndDate: weekBounds.end,
    activitiesDone: '',
    volunteersInvolved: '',
    challengesFaced: '',
    nextWeekPlan: '',
  });

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) setDbUser(data.user);
    } catch {
      console.error('Failed to fetch user');
    }
  }, []);

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

  useEffect(() => {
    fetchMe();
    fetchVillages();
  }, [fetchMe, fetchVillages]);

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

  const openReportForm = (villageId) => {
    const wb = getWeekBounds();
    setReportForm({
      weekStartDate: wb.start,
      weekEndDate: wb.end,
      activitiesDone: '',
      volunteersInvolved: '',
      challengesFaced: '',
      nextWeekPlan: '',
    });
    setShowReportForm(villageId);
    if (expandedVillage !== villageId) {
      setExpandedVillage(villageId);
      fetchReports(villageId);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportForm.activitiesDone.trim()) {
      toast.error('Please describe the activities done this week');
      return;
    }
    if (!reportForm.weekStartDate || !reportForm.weekEndDate) {
      toast.error('Please set the week date range');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/villages/${showReportForm}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reportForm,
          volunteersInvolved: parseInt(reportForm.volunteersInvolved) || 0,
          status: 'SUBMITTED'
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Weekly report submitted successfully!');
        setShowReportForm(null);
        fetchReports(expandedVillage);
      } else {
        toast.error(data.message || 'Failed to submit report');
      }
    } catch {
      toast.error('Error submitting report');
    }
    setSubmitting(false);
  };

  const getStatusBadgeColor = (status) => {
    if (status === 'ACTIVE') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    if (status === 'COMPLETED') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    return 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
  };

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';
  const inputClass = 'w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-logo-teal/50 transition';
  const labelClass = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1';

  if (loading) return <div className="text-slate-500 py-8 text-center animate-pulse">Loading your assigned villages...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <MapPin className="w-7 h-7 text-logo-teal" /> My Village Reports
        </h2>
        <p className="text-slate-500 text-sm mt-1">View your adopted village assignments and submit weekly progress reports to admin.</p>
      </div>

      {/* Quick Stats */}
      {villages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Assigned Villages', value: villages.length, icon: MapPin, color: 'text-logo-teal' },
            { label: 'Active', value: villages.filter(v => v.status === 'ACTIVE').length, icon: Check, color: 'text-emerald-600' },
            { label: 'Total Reports', value: villages.reduce((s, v) => s + (v._count?.weeklyReports || 0), 0), icon: FileText, color: 'text-logo-navy dark:text-logo-teal' },
            { label: 'Pending Review', value: 'N/A', icon: Clock, color: 'text-amber-600' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className={`${cardClass} p-4 flex items-center gap-3`}>
                <div className={`w-10 h-10 rounded-xl ${stat.color} bg-current/10 flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-white">{stat.value}</p>
                  <p className="text-[10px] font-semibold text-slate-400">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Village Cards */}
      {villages.length === 0 ? (
        <div className={`${cardClass} p-12 text-center space-y-3`}>
          <MapPin className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto" />
          <p className="text-slate-400 font-medium">No villages assigned to you yet</p>
          <p className="text-slate-400 text-sm">Contact your admin to assign adopted villages to your NSS unit.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {villages.map(v => (
            <div key={v.id} className={`${cardClass} overflow-hidden`}>
              {/* Village Header */}
              <div className="p-5 flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0 flex-1 cursor-pointer" onClick={() => toggleExpand(v.id)}>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-logo-green to-logo-teal text-white flex items-center justify-center shrink-0 shadow-sm">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">{v.name}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getStatusBadgeColor(v.status)}`}>{v.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" /> {v.district}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {v.department?.name || 'N/A'}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Adopted {new Date(v.adoptedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {v._count?.weeklyReports || 0} reports filed</span>
                    </div>
                    {v.description && <p className="text-xs text-slate-400 italic mt-1">{v.description}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  {v.status === 'ACTIVE' && (
                    <button
                      onClick={() => openReportForm(v.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-xl text-xs font-bold hover:opacity-90 transition shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Submit Report
                    </button>
                  )}
                  <button onClick={() => toggleExpand(v.id)} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-500 hover:bg-slate-100 transition">
                    {expandedVillage === v.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Weekly Report Form */}
              {showReportForm === v.id && (
                <div className="mx-5 mb-4 p-5 bg-logo-teal/5 dark:bg-logo-teal/10 rounded-2xl border border-logo-teal/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Send className="w-4 h-4 text-logo-teal" /> New Weekly Report
                    </h4>
                    <button onClick={() => setShowReportForm(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Week Start Date *</label>
                      <input type="date" className={inputClass} value={reportForm.weekStartDate} onChange={e => setReportForm(f => ({ ...f, weekStartDate: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Week End Date *</label>
                      <input type="date" className={inputClass} value={reportForm.weekEndDate} onChange={e => setReportForm(f => ({ ...f, weekEndDate: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Activities Done This Week *</label>
                      <textarea
                        className={`${inputClass} min-h-[100px] resize-y`}
                        placeholder="Describe the activities, outreach, and work done this week in the village..."
                        value={reportForm.activitiesDone}
                        onChange={e => setReportForm(f => ({ ...f, activitiesDone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Volunteers Involved</label>
                      <input type="number" className={inputClass} placeholder="e.g. 25" value={reportForm.volunteersInvolved} onChange={e => setReportForm(f => ({ ...f, volunteersInvolved: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Challenges Faced</label>
                      <input className={inputClass} placeholder="Any issues or blockers..." value={reportForm.challengesFaced} onChange={e => setReportForm(f => ({ ...f, challengesFaced: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Next Week Plan</label>
                      <textarea
                        className={`${inputClass} min-h-[60px] resize-y`}
                        placeholder="What do you plan to do next week?"
                        value={reportForm.nextWeekPlan}
                        onChange={e => setReportForm(f => ({ ...f, nextWeekPlan: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setShowReportForm(null)} className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium">Cancel</button>
                    <button
                      onClick={handleSubmitReport}
                      disabled={submitting}
                      className="flex items-center gap-2 px-5 py-2 text-xs rounded-xl bg-gradient-to-r from-logo-navy to-logo-teal text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
                    >
                      {submitting ? 'Submitting...' : <><Send className="w-3.5 h-3.5" /> Submit Weekly Report</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Report History */}
              {expandedVillage === v.id && (
                <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-4 bg-slate-50/50 dark:bg-slate-900/30">
                  <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-logo-teal" /> Report History
                  </h4>

                  {loadingReports ? (
                    <p className="text-xs text-slate-400 animate-pulse py-3">Loading reports...</p>
                  ) : reports.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3">No reports submitted yet. Click &ldquo;Submit Report&rdquo; to file your first weekly progress update.</p>
                  ) : (
                    <div className="space-y-3">
                      {reports.map(r => (
                        <div key={r.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {new Date(r.weekStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(r.weekEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                r.status === 'REVIEWED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                                r.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                                'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                              }`}>{r.status}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300"><strong>Activities:</strong> {r.activitiesDone}</p>

                          <div className="flex gap-4 text-[11px] text-slate-400">
                            <span><Users className="w-3 h-3 inline mr-0.5" /> {r.volunteersInvolved} volunteers</span>
                            {r.challengesFaced && <span>Challenges: {r.challengesFaced}</span>}
                          </div>

                          {r.nextWeekPlan && (
                            <p className="text-[11px] text-slate-400"><strong>Next Week:</strong> {r.nextWeekPlan}</p>
                          )}

                          {/* Admin Review Section */}
                          {r.adminRemarks && (
                            <div className="mt-2 bg-logo-teal/5 dark:bg-logo-teal/10 rounded-lg p-3 border border-logo-teal/20">
                              <p className="text-[10px] font-extrabold text-logo-teal uppercase mb-0.5 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> Admin Review
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-300">{r.adminRemarks}</p>
                            </div>
                          )}

                          {r.status === 'SUBMITTED' && !r.adminRemarks && (
                            <p className="text-[10px] text-amber-500 italic flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Awaiting admin review
                            </p>
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
  );
}
