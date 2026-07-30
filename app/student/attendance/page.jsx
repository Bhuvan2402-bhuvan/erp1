'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  ClipboardCheck, Search, CheckCircle, XCircle, Award, Calendar, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentAttendancePage() {
  const [attendances, setAttendances] = useState([]);
  const [stats, setStats] = useState({ totalRecords: 0, presentCount: 0, absentCount: 0, attendanceRate: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/attendance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAttendances(data.attendances || []);
        if (data.stats) setStats(data.stats);
      } else {
        toast.error('Failed to load attendance history');
      }
    } catch (err) {
      toast.error('Network error loading attendance');
    }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ClipboardCheck className="w-7 h-7 text-logo-teal" />
          My Attendance & Service Records
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          View your complete event attendance log, verified presences, and service history.
        </p>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-logo-navy/10 dark:bg-logo-navy/30 text-logo-navy dark:text-logo-teal rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Events Registered</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.totalRecords}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Present</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.presentCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Absences</p>
            <p className="text-2xl font-extrabold text-red-600 dark:text-red-400">{stats.absentCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{stats.attendanceRate}%</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search event title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-logo-teal"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-logo-teal text-slate-700 dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        <button
          onClick={fetchAttendance}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 text-sm font-semibold transition"
        >
          <RefreshCw className="w-4 h-4" /> Refresh History
        </button>
      </div>

      {/* Attendance Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse">Loading attendance history...</div>
        ) : attendances.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ClipboardCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold">No attendance records logged yet.</p>
            <p className="text-xs text-slate-400 mt-1">Register for upcoming events and check back after attendance is marked by coordinators.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Event Title</th>
                  <th className="px-6 py-4">Event Type</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {attendances.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {att.event?.title || 'Unknown Event'}
                      <div className="text-xs font-normal text-slate-500">{att.event?.location || 'Campus'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-logo-teal rounded-full uppercase tracking-wider">
                        {att.event?.type || 'Activity'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {att.event?.date ? new Date(att.event.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {att.present ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" /> Present (+3 Service Hours)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> Absent
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
