'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Users, GraduationCap, Clock, BookOpen,
  Calendar, AlertTriangle, RefreshCw, TrendingUp
} from 'lucide-react';

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-14 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-3 w-20 bg-slate-100 dark:bg-slate-600 rounded" />
        </div>
      </div>
    </div>
  );
}

function SkeletonList({ rows = 4 }) {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-700 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="py-4 flex justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-2.5 w-24 bg-slate-100 dark:bg-slate-600 rounded" />
            </div>
          </div>
          <div className="h-5 w-16 bg-slate-100 dark:bg-slate-700 rounded-full" />
        </div>
      ))}
    </div>
  );
}

const STAT_CARDS = [
  { key: 'totalVolunteers', label: 'Volunteers', icon: Users,        color: 'blue'   },
  { key: 'totalFaculty',    label: 'Faculty',    icon: GraduationCap, color: 'emerald'},
  { key: 'pendingApprovals',label: 'Pending',    icon: Clock,         color: 'amber'  },
  { key: 'totalDepartments',label: 'Branches',   icon: BookOpen,      color: 'indigo' },
  { key: 'totalEvents',     label: 'Events',     icon: Calendar,      color: 'purple' },
  { key: 'openIssues',      label: 'Open Issues',icon: AlertTriangle,  color: 'rose'   },
];

const COLOR_MAP = {
  blue:    { bg: 'bg-blue-50 dark:bg-blue-950/30',    icon: 'text-blue-500',    border: 'border-blue-100 dark:border-blue-900/40',    value: 'text-blue-600 dark:text-blue-400'    },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: 'text-emerald-500', border: 'border-emerald-100 dark:border-emerald-900/40', value: 'text-emerald-600 dark:text-emerald-400' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-950/30',  icon: 'text-amber-500',   border: 'border-amber-100 dark:border-amber-900/40',  value: 'text-amber-600 dark:text-amber-400'  },
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-950/30',icon: 'text-indigo-500',  border: 'border-indigo-100 dark:border-indigo-900/40', value: 'text-indigo-600 dark:text-indigo-400' },
  purple:  { bg: 'bg-purple-50 dark:bg-purple-950/30',icon: 'text-purple-500',  border: 'border-purple-100 dark:border-purple-900/40', value: 'text-purple-600 dark:text-purple-400' },
  rose:    { bg: 'bg-rose-50 dark:bg-rose-950/30',    icon: 'text-rose-500',    border: 'border-rose-100 dark:border-rose-900/40',    value: 'text-rose-600 dark:text-rose-400'    },
};

const ROLE_BADGE = {
  ADMIN:   'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  FACULTY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  STUDENT: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

const STATUS_BADGE = {
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  PENDING:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

function UserInitials({ name }) {
  const initials = name ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-500 dark:to-slate-700 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-white">{initials}</span>
    </div>
  );
}

export default function AdminOverview() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch stats');
      setStats(data);
    } catch (e) {
      setError(e.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const cardBase = 'bg-white dark:bg-slate-800 rounded-2xl border shadow-sm';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Live system snapshot</p>
        </div>
        <button
          id="overview-refresh-btn"
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
          <AlertTriangle size={28} className="text-red-500" />
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading
          ? STAT_CARDS.map((_, i) => <SkeletonCard key={i} />)
          : STAT_CARDS.map(({ key, label, icon: Icon, color }) => {
              const c = COLOR_MAP[color];
              return (
                <div
                  key={key}
                  className={`${cardBase} ${c.border} p-5 flex flex-col gap-3 hover:shadow-md transition-shadow`}
                >
                  <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                    <Icon size={18} className={c.icon} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${c.value}`}>
                      {stats?.stats?.[key] ?? '—'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* Recent Registrations + Upcoming Events */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Recent Registrations */}
        <div className={`${cardBase} border-slate-200 dark:border-slate-700 p-6`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp size={16} className="text-slate-400" />
              Recent Registrations
            </h3>
            <span className="text-xs text-slate-400 font-medium">Latest 5</span>
          </div>

          {loading ? <SkeletonList rows={4} /> : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {stats?.recentUsers?.length > 0 ? stats.recentUsers.map(u => (
                <div key={u.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserInitials name={u.name} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{u.name}</p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[u.role] || ROLE_BADGE.STUDENT}`}>
                      {u.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[u.approvalStatus] || STATUS_BADGE.PENDING}`}>
                      {u.approvalStatus}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-400 py-6 text-center">No recent registrations</p>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className={`${cardBase} border-slate-200 dark:border-slate-700 p-6`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              Upcoming Events
            </h3>
            <span className="text-xs text-slate-400 font-medium">Next 5</span>
          </div>

          {loading ? <SkeletonList rows={4} /> : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {stats?.upcomingEvents?.length > 0 ? stats.upcomingEvents.map(e => {
                const d = new Date(e.date);
                const month = d.toLocaleString('default', { month: 'short' });
                const day = d.getDate();
                const registrations = e._count?.registrations || 0;
                return (
                  <div key={e.id} className="py-3.5 flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 text-center">
                      <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 rounded-xl px-1 py-1.5">
                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase leading-none">{month}</p>
                        <p className="text-base font-bold text-purple-700 dark:text-purple-300 leading-tight">{day}</p>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{e.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">{registrations} registered</span>
                        {registrations > 0 && (
                          <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full max-w-20">
                            <div
                              className="h-1 bg-purple-400 dark:bg-purple-500 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (registrations / 50) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-sm text-slate-400 py-6 text-center">No upcoming events</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
