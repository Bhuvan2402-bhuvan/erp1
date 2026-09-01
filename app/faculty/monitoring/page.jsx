'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Calendar, Users, Clock, Award, Building2,
  Download, Filter, RefreshCw, Star, CheckCircle2, Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function FacultyMonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedYear, setSelectedYear] = useState('2025-2026');

  const fetchMonitoringData = useCallback(async (year = selectedYear) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (year) params.set('academicYear', year);

      const res = await fetch(`/api/monitoring/academic-years?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      } else {
        toast.error(json.message || 'Failed to fetch branch academic year data');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error loading monitoring metrics');
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchMonitoringData(selectedYear);
  }, [fetchMonitoringData, selectedYear]);

  const handleExportCSV = () => {
    if (!data) return;
    const headers = ['Volunteer Name', 'Roll No', 'Branch', 'Points', 'Verified Service Hours', 'Coordinator Role'];
    const rows = (data.topVolunteers || []).map(v => [
      `"${v.name}"`,
      `"${v.rollNo}"`,
      `"${v.departmentCode}"`,
      v.points,
      v.serviceHours,
      v.isCoordinator ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Branch_NSS_Report_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Branch Report for AY ${selectedYear} downloaded!`);
  };

  const overall = data?.overallStats || {
    totalVolunteers: 0,
    totalCoordinators: 0,
    totalEvents: 0,
    totalServiceHours: 0,
    totalAttendances: 0,
    averageHoursPerVolunteer: 0
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-logo-navy to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-logo-teal/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-logo-teal/20 text-logo-teal text-xs font-extrabold uppercase tracking-wider mb-2 border border-logo-teal/30">
              <TrendingUp className="w-3.5 h-3.5" /> Department Coordinator View
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Academic Year Branch Monitoring</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Supervise your branch volunteers, verified service hours, and event drives across each academic cycle.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchMonitoringData(selectedYear)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/10"
              title="Refresh Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-logo-teal to-emerald-500 text-slate-950 font-black text-xs hover:opacity-90 shadow-md transition"
            >
              <Download className="w-4 h-4" />
              <span>Export Branch Report (CSV)</span>
            </button>
          </div>
        </div>

        {/* Academic Year Selector Pills */}
        <div className="relative z-10 mt-6 pt-6 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Academic Year:</span>
          {['2026-2027', '2025-2026', '2024-2025', '2023-2024', '2022-2023'].map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition whitespace-nowrap ${
                selectedYear === year
                  ? 'bg-logo-teal text-slate-950 shadow-md scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Branch Enrolled Volunteers', value: `${overall.totalVolunteers}`, desc: 'Active approved volunteers', icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40' },
          { label: 'Branch Service Hours', value: `${overall.totalServiceHours?.toLocaleString()}+`, desc: `Avg ${overall.averageHoursPerVolunteer} hrs/student`, icon: Clock, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40' },
          { label: 'Department Events Executed', value: `${overall.totalEvents}`, desc: 'Drives, rallies, camps', icon: Calendar, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40' },
          { label: 'Student Coordinators', value: `${overall.totalCoordinators}`, desc: 'Branch student leads', icon: Award, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/40' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{card.label}</span>
                <div className={`p-2.5 rounded-2xl ${card.color} border`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{card.value}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Branch Volunteers & Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Department Volunteers */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" /> Top Branch Volunteers (AY {selectedYear})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Highest point earners and hours contributors in your branch.</p>
            </div>
            <Link href="/faculty/branch" className="text-xs font-bold text-logo-teal hover:underline">
              View All &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {(data?.topVolunteers || []).length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No volunteer records for AY {selectedYear}.</div>
            ) : (
              (data?.topVolunteers || []).slice(0, 6).map((vol, idx) => (
                <div key={vol.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      idx === 0 ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{vol.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{vol.rollNo} {vol.isCoordinator ? '• Coordinator' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-logo-teal">{vol.points} pts</span>
                    <p className="text-[10px] text-slate-400">{vol.serviceHours} hrs</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Branch Campaigns in Academic Year */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-logo-teal" /> Branch Campaigns Executed (AY {selectedYear})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Events and drives organized under your department.</p>
            </div>
            <Link href="/faculty/events" className="text-xs font-bold text-logo-teal hover:underline">
              Create Event &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {(data?.events || []).length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No branch events executed in AY {selectedYear}.</div>
            ) : (
              (data?.events || []).slice(0, 5).map((evt) => (
                <div key={evt.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-logo-teal/10 text-logo-teal border border-logo-teal/20">
                      {evt.type}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1">{evt.title}</h4>
                    <p className="text-[10px] text-slate-400">{new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{evt.registrationsCount}</span>
                    <p className="text-[10px] text-slate-400">volunteers</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
