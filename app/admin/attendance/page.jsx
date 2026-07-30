'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  ClipboardCheck, Search, Download, CheckCircle, XCircle, Users, Calendar, Filter, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAttendancePage() {
  const [attendances, setAttendances] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalRecords: 0, presentCount: 0, absentCount: 0, attendanceRate: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || []);
      }
    } catch (e) {}
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (e) {}
  };

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedDept) params.append('departmentId', selectedDept);
      if (selectedEvent) params.append('eventId', selectedEvent);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/attendance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAttendances(data.attendances || []);
        if (data.stats) setStats(data.stats);
      } else {
        toast.error('Failed to load attendance logs');
      }
    } catch (err) {
      toast.error('Network error loading attendance');
    }
    setLoading(false);
  }, [search, selectedDept, selectedEvent, statusFilter]);

  useEffect(() => {
    fetchDepartments();
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (selectedDept) params.append('departmentId', selectedDept);
    window.open(`/api/attendance/export?${params.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-logo-teal" />
            Attendance Audit & Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor, audit, and export volunteer attendance records across all branches and events.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-logo-navy to-logo-teal text-white text-sm font-semibold rounded-xl hover:opacity-90 transition shadow-sm"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-logo-navy/10 dark:bg-logo-navy/30 text-logo-navy dark:text-logo-teal rounded-xl">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Records</p>
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
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{stats.attendanceRate}%</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search student or event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-logo-teal"
          />
        </div>

        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-logo-teal text-slate-700 dark:text-slate-200"
          >
            <option value="">All Branches</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-logo-teal text-slate-700 dark:text-slate-200"
          >
            <option value="">All Events</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-logo-teal text-slate-700 dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="present">Verified Present</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        <button
          onClick={fetchAttendance}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 text-sm font-semibold transition"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Attendance Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse">Loading attendance records...</div>
        ) : attendances.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ClipboardCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold">No attendance records found matching filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Roll No / Branch</th>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {attendances.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {att.student?.user?.name || 'Unknown Student'}
                      <div className="text-xs font-normal text-slate-500">{att.student?.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md">
                        {att.student?.rollNo || 'N/A'}
                      </span>
                      <div className="text-xs text-slate-500 mt-0.5">{att.student?.department?.code}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                      {att.event?.title || 'Unknown Event'}
                      <div className="text-xs text-logo-teal capitalize">{att.event?.type}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {att.event?.date ? new Date(att.event.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {att.present ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" /> Present
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
