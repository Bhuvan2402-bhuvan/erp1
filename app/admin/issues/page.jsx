'use client';
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/issues');
      const data = await res.json();
      setIssues(data.issues || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleResolveIssue = async (issueId, status) => {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Complaint status updated to ${status === 'RESOLVED' ? 'SOLVED' : 'NOT SOLVED'}`);
        fetchData();
      } else {
        toast.error('Failed to update complaint status');
      }
    } catch (err) {
      toast.error('Error updating status');
    }
  };

  if (loading) return <div className="text-slate-500 py-8">Loading complaints...</div>;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">1:1 Complaint Box Management</h2>
          <p className="text-xs text-slate-400">Review volunteer complaints and switch status between Solved and Not Solved.</p>
        </div>
      </div>

      <div className="space-y-4">
        {issues.map(issue => {
          const isSolved = issue.status === 'RESOLVED' || issue.status === 'CLOSED';
          return (
            <div key={issue.id} className={cardClass}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">{issue.title}</h4>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Submitted by: <span className="text-slate-700 dark:text-slate-200 font-bold">{issue.student?.user?.name}</span> ({issue.student?.department?.code} • Roll {issue.student?.rollNo})
                    <span className="ml-2">• {new Date(issue.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase flex items-center gap-1.5 ${
                    isSolved
                      ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
                  }`}>
                    {isSolved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {isSolved ? 'SOLVED' : 'NOT SOLVED'}
                  </span>
                  {!isSolved ? (
                    <button
                      onClick={() => handleResolveIssue(issue.id, 'RESOLVED')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      Mark as SOLVED
                    </button>
                  ) : (
                    <button
                      onClick={() => handleResolveIssue(issue.id, 'OPEN')}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
                    >
                      Reopen (NOT SOLVED)
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                {issue.description}
              </p>
            </div>
          );
        })}
        {issues.length === 0 && <p className="text-center text-slate-400 py-12 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">No complaints reported.</p>}
      </div>
    </div>
  );
}
