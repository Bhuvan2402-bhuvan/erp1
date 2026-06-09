'use client';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

export default function StudentIssues() {
  const [issues, setIssues] = useState([]);
  const [issueForm, setIssueForm] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/issues');
    const data = await res.json();
    setIssues(data.issues || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReportIssue = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/issues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(issueForm) });
    if (res.ok) {
      toast.success('Issue reported successfully');
      setIssueForm({ title: '', description: '' });
      fetchData();
    } else {
      toast.error('Failed to report issue');
    }
  };

  if (loading) return <div className="text-slate-500 py-8">Loading issues...</div>;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';
  const btnPrimary = 'px-4 py-2 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-lg hover:opacity-90 transition text-sm font-medium shadow-sm';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Report an Issue</h2>
      <form onSubmit={handleReportIssue} className={`${cardClass} p-6 space-y-4`}>
        <input placeholder="Issue title" required value={issueForm.title} onChange={e => setIssueForm({...issueForm, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
        <textarea placeholder="Describe the issue..." required value={issueForm.description} onChange={e => setIssueForm({...issueForm, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" rows={3} />
        <button type="submit" className={btnPrimary}>Submit Issue</button>
      </form>
      <div className="space-y-3">
        {issues.map(issue => (
          <div key={issue.id} className={`${cardClass} p-5`}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold">{issue.title}</h4>
                <p className="text-sm text-slate-500 mt-1">{issue.description}</p>
                <p className="text-xs text-slate-400 mt-2">{new Date(issue.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${issue.status === 'OPEN' ? 'bg-red-100 text-red-700' : issue.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{issue.status}</span>
            </div>
          </div>
        ))}
        {issues.length === 0 && <p className="text-center text-slate-500 py-4">No issues reported yet.</p>}
      </div>
    </div>
  );
}
