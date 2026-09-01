'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Calendar, Users, Clock, Award, Building2,
  Download, Filter, ArrowUpRight, CheckCircle2, RefreshCw, BarChart3, Star, Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminMonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const fetchMonitoringData = useCallback(async (year = selectedYear, dept = selectedDepartment) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (year) params.set('academicYear', year);
      if (dept) params.set('departmentId', dept);

      const res = await fetch(`/api/monitoring/academic-years?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      } else {
        toast.error(json.message || 'Failed to fetch academic year data');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error loading monitoring metrics');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedDepartment]);

  useEffect(() => {
    fetchMonitoringData(selectedYear, selectedDepartment);
  }, [fetchMonitoringData, selectedYear, selectedDepartment]);

  const handleExportCSV = () => {
    if (!data) return;
    const headers = ['Department Code', 'Department Name', 'Enrolled Volunteers', 'Faculty Officers', 'Events Executed', 'Service Hours Generated', 'Rank'];
    const rows = (data.departmentBreakdown || []).map(d => [
      `"${d.code}"`,
      `"${d.name}"`,
      d.volunteerCount,
      d.facultyCount,
      d.eventCount,
      d.totalHours,
      d.performanceRank
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NSS_Academic_Year_Report_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Academic Year ${selectedYear} Report downloaded!`);
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
      {/* Top Banner & Control Toolbar */}
      <div className="bg-gradient-to-br from-slate-900 via-logo-navy to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-logo-teal/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-logo-teal/20 text-logo-teal text-xs font-extrabold uppercase tracking-wider mb-2 border border-logo-teal/30">
              <TrendingUp className="w-3.5 h-3.5" /> Institutional Analytics
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Academic Year Wise Monitoring</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Track student volunteer enrollment, verified community service hours, event drives, and department benchmarks year-by-year.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchMonitoringData(selectedYear, selectedDepartment)}
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
              <span>Export AY Report (CSV)</span>
            </button>
          </div>
        </div>

        {/* Academic Year Selector Pills */}
        <div className="relative z-10 mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
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

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-logo-teal"
            >
              <option value="" className="bg-slate-900 text-white">All Academic Branches</option>
              {(data?.departmentBreakdown || []).map(d => (
                <option key={d.id} value={d.id} className="bg-slate-900 text-white">{d.name} ({d.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Enrolled Volunteers', value: `${overall.totalVolunteers}+`, desc: `Across all ${data?.departmentBreakdown?.length || 10} departments`, icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40' },
          { label: 'Verified Service Hours', value: `${overall.totalServiceHours?.toLocaleString()}+`, desc: `Avg ${overall.averageHoursPerVolunteer} hrs/volunteer`, icon: Clock, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40' },
          { label: 'Campaigns & Drives Executed', value: `${overall.totalEvents}`, desc: 'Blood drives, rallies, workshops', icon: Calendar, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40' },
          { label: 'Student Coordinators', value: `${overall.totalCoordinators}`, desc: 'Student unit leaders', icon: Award, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/40' },
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

      {/* Year-over-Year Trend Analysis & Department Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Year-over-Year Progression (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-logo-teal" /> Year-over-Year Growth Comparison
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Historical growth across academic cycles.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-logo-teal/10 text-logo-teal border border-logo-teal/20">
              5-Year Audit
            </span>
          </div>

          <div className="space-y-4">
            {(data?.yearWiseTrends || []).map((trend) => {
              const maxHours = 20000;
              const pct = Math.min(100, Math.round((trend.hours / maxHours) * 100));
              const isCurrent = trend.academicYear === selectedYear;

              return (
                <div
                  key={trend.academicYear}
                  onClick={() => setSelectedYear(trend.academicYear)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    isCurrent
                      ? 'bg-logo-teal/5 border-logo-teal shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700/60 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                        isCurrent ? 'bg-logo-teal text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        AY {trend.academicYear}
                      </span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {trend.volunteers} Volunteers &bull; {trend.events} Events
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {trend.hours.toLocaleString()} hrs
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCurrent ? 'bg-gradient-to-r from-logo-navy to-logo-teal' : 'bg-slate-400 dark:bg-slate-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Volunteers Spotlight (1 Col) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" /> AY Top Volunteers
              </h3>
              <span className="text-xs text-slate-400 font-bold">AY {selectedYear}</span>
            </div>

            <div className="space-y-3">
              {(data?.topVolunteers || []).slice(0, 5).map((vol, index) => (
                <div key={vol.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      index === 0 ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      #{index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{vol.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{vol.rollNo} &bull; {vol.departmentCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-logo-teal">{vol.points} pts</span>
                    <p className="text-[10px] text-slate-400">{vol.serviceHours} hrs</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/admin/volunteers"
            className="w-full text-center py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition block"
          >
            View All Volunteer Profiles &rarr;
          </Link>
        </div>
      </div>

      {/* Department Breakdown Matrix */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-logo-teal" /> Departmental Performance Matrix (AY {selectedYear})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Discipline-wise comparison of volunteer strength, events organized, and logged service hours.</p>
          </div>

          <button
            onClick={handleExportCSV}
            className="text-xs font-bold text-logo-teal hover:underline flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" /> Download Department Table
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Branch / Discipline</th>
                <th className="py-3 px-4 text-center">Enrolled Volunteers</th>
                <th className="py-3 px-4 text-center">Faculty Officers</th>
                <th className="py-3 px-4 text-center">Events Conducted</th>
                <th className="py-3 px-4 text-right">Service Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
              {(data?.departmentBreakdown || []).map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition">
                  <td className="py-3.5 px-4 font-black text-slate-400">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md ${
                      dept.performanceRank === 1 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-black' :
                      dept.performanceRank === 2 ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200' :
                      dept.performanceRank === 3 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' :
                      'text-slate-500'
                    }`}>
                      {dept.performanceRank}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 dark:text-white">{dept.name}</span>
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300">
                      {dept.code}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                    {dept.volunteerCount}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-400">
                    {dept.facultyCount}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-logo-teal/10 text-logo-teal font-extrabold">
                      {dept.eventCount}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                    {dept.totalHours.toLocaleString()} hrs
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Events Logged in Academic Year */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-logo-teal" /> Campaign & Event Archive (AY {selectedYear})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">All campaigns, blood drives, and social work executed in this cycle.</p>
          </div>
          <Link href="/admin/events" className="text-xs font-bold text-logo-teal hover:underline">
            Manage Events &rarr;
          </Link>
        </div>

        {(data?.events || []).length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-sm">No events recorded in AY {selectedYear}.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.events || []).map(evt => (
              <div key={evt.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-logo-teal/10 text-logo-teal border border-logo-teal/20">
                      {evt.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{evt.title}</h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">By {evt.coordinatorName || 'NSS Unit'} &bull; {evt.departmentCode}</p>
                </div>
                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{evt.registrationsCount} volunteers registered</span>
                  <span>{evt.photosCount} photos</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
