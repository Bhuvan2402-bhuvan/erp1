'use client';
import { useMemo } from 'react';
import { TrendingUp, Users, CheckCircle2, XCircle, Clock, FileText, BarChart3 } from 'lucide-react';

function MiniBar({ value, max, color = 'bg-logo-teal' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-6 text-right">{value}</span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-500',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500',
    amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-500',
    red: 'bg-red-50 dark:bg-red-950/30 text-red-500',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-500',
    purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-500',
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function FormAnalyticsDashboard({ analytics, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 h-20" />
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  const {
    totalResponses, submitted, approved, rejected, underReview, draft,
    completionRate, submissionTrend = [], yearBreakdown = [], fieldStats = []
  } = analytics;

  const trendMax = submissionTrend.length > 0 ? Math.max(...submissionTrend.map(d => parseInt(d.count) || 0), 1) : 1;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total Responses" value={totalResponses} icon={Users} color="blue" />
        <StatCard label="Submitted" value={submitted} icon={FileText} color="purple" />
        <StatCard label="Approved" value={approved} icon={CheckCircle2} color="emerald" />
        <StatCard label="Rejected" value={rejected} icon={XCircle} color="red" />
        <StatCard label="Under Review" value={underReview} icon={Clock} color="amber" />
        <StatCard label="Completion Rate" value={`${completionRate}%`} icon={TrendingUp} color="slate" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Submission Trend */}
        {submissionTrend.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" /> Submission Trend (Last 30 days)
            </h3>
            <div className="space-y-2">
              {submissionTrend.map((d, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                    <span>{new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span>{d.count}</span>
                  </div>
                  <MiniBar value={parseInt(d.count)} max={trendMax} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Year Breakdown */}
        {yearBreakdown.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" /> Responses by Year
            </h3>
            <div className="space-y-3">
              {yearBreakdown.map((row, i) => {
                const maxYr = Math.max(...yearBreakdown.map(r => parseInt(r.count) || 0), 1);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
                      <span className="font-medium">Year {row.year}</span>
                      <span>{row.count}</span>
                    </div>
                    <MiniBar value={parseInt(row.count)} max={maxYr} color="bg-logo-navy dark:bg-logo-teal" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Per-field Choice Stats */}
      {fieldStats.filter(fs => Object.keys(fs.tally || {}).length > 0).map(fs => {
        const total = Object.values(fs.tally).reduce((a, b) => a + b, 0);
        const entries = Object.entries(fs.tally).sort((a, b) => b[1] - a[1]);
        return (
          <div key={fs.fieldId} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{fs.label}</h3>
            <p className="text-xs text-slate-400 mb-4">{total} response{total !== 1 ? 's' : ''}</p>
            <div className="space-y-3">
              {entries.map(([label, count]) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{label}</span>
                    <span className="text-slate-400">{count} ({total > 0 ? Math.round((count / total) * 100) : 0}%)</span>
                  </div>
                  <MiniBar value={count} max={total || 1} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
