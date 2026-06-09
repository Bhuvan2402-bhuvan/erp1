'use client';
import { useState, useEffect, useCallback } from 'react';
import { Check } from 'lucide-react';

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
    await fetch(`/api/issues/${issueId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    fetchData();
  };

  if (loading) return <div className="text-slate-500 py-8">Loading issues...</div>;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold">Reported Issues</h2>
      <div className="space-y-3">
        {issues.map(issue => (
          <div key={issue.id} className={`${cardClass} p-5`}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold">{issue.title}</h4>
                <p className="text-sm text-slate-500 mt-1">{issue.description}</p>
                <p className="text-xs text-slate-400 mt-2">By: {issue.student?.user?.name} ({issue.student?.department?.code}) • {new Date(issue.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${issue.status === 'OPEN' ? 'bg-red-100 text-red-700' : issue.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{issue.status}</span>
                {issue.status === 'OPEN' && (
                  <button onClick={() => handleResolveIssue(issue.id, 'RESOLVED')} className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"><Check className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          </div>
        ))}
        {issues.length === 0 && <p className="text-center text-slate-500 py-8">No issues reported.</p>}
      </div>
    </div>
  );
}
