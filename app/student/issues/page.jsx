'use client';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { MessageSquare, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react';

export default function StudentIssues() {
  const [issues, setIssues] = useState([]);
  const [issueForm, setIssueForm] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/issues');
      const data = await res.json();
      setIssues(data.issues || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReportIssue = async (e) => {
    e.preventDefault();
    if (!issueForm.title || !issueForm.description) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueForm)
      });
      if (res.ok) {
        toast.success('Complaint submitted to branch coordinators');
        setIssueForm({ title: '', description: '' });
        fetchData();
      } else {
        toast.error('Failed to submit complaint');
      }
    } catch (err) {
      toast.error('Error submitting complaint');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-slate-500 py-8">Loading complaint box...</div>;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-logo-navy to-logo-teal text-white p-6 rounded-3xl shadow-md">
        <div className="flex items-center gap-3 mb-1">
          <MessageSquare className="w-6 h-6" />
          <h2 className="text-xl font-bold">1:1 Volunteer Complaint & Grievance Box</h2>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed">
          Submit direct 1:1 complaints or requests to your branch coordinators and faculty. Track real-time status updates: Solved vs Not Solved.
        </p>
      </div>

      {/* New Complaint Form */}
      <form onSubmit={handleReportIssue} className={cardClass}>
        <h3 className="text-lg font-bold mb-4">Submit New Complaint</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Complaint Subject / Title</label>
            <input
              placeholder="e.g. Discrepancy in event attendance service hours"
              required
              value={issueForm.title}
              onChange={e => setIssueForm({ ...issueForm, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-logo-teal"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Detailed Description</label>
            <textarea
              placeholder="Provide complete context for coordinators..."
              required
              value={issueForm.description}
              onChange={e => setIssueForm({ ...issueForm, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-logo-teal"
              rows={4}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-xl font-bold text-xs shadow-md hover:opacity-90 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </div>
      </form>

      {/* History */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">My Complaints History</h3>

        {issues.map(issue => {
          const isSolved = issue.status === 'RESOLVED' || issue.status === 'CLOSED' || issue.status === 'SOLVED';
          return (
            <div key={issue.id} className={cardClass}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">{issue.title}</h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Submitted: {new Date(issue.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase flex items-center gap-1.5 ${
                  isSolved
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                    : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
                }`}>
                  {isSolved ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  {isSolved ? 'SOLVED' : 'NOT SOLVED'}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-3">
                {issue.description}
              </p>

              {isSolved && issue.resolvedBy && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  ✓ Resolved by {issue.resolvedBy.name}
                </div>
              )}
            </div>
          );
        })}

        {issues.length === 0 && (
          <div className="text-center text-slate-400 py-10 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
            No complaints logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
