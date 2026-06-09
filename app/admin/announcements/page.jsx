'use client';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

export default function AdminAnnouncements() {
  const [publicMessages, setPublicMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true);
    const res = await fetch(`/api/public-messages?page=${p}&limit=20`);
    const data = await res.json();
    setPublicMessages(data.messages || []);
    setPage(data.pagination?.page || 1);
    setTotalPages(data.pagination?.totalPages || 1);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const handlePostPublicMessage = async () => {
    if (!newMessage.trim()) return;
    const res = await fetch('/api/public-messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newMessage }) });
    if (res.ok) {
      setNewMessage('');
      toast.success('Message posted');
      fetchData(1);
    } else {
      toast.error('Failed to post message');
    }
  };

  if (loading && publicMessages.length === 0) return <div className="text-slate-500 py-8">Loading announcements...</div>;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';
  const btnPrimary = 'px-4 py-2 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-lg hover:opacity-90 transition text-sm font-medium shadow-sm';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold">Public Announcements</h2>
      <div className={`${cardClass} p-6`}>
        <div className="flex gap-3">
          <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a public announcement..." className="flex-1 px-4 py-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" onKeyDown={e => e.key === 'Enter' && handlePostPublicMessage()} />
          <button onClick={handlePostPublicMessage} className={btnPrimary}>Post</button>
        </div>
      </div>
      <div className="space-y-3">
        {publicMessages.map(msg => (
          <div key={msg.id} className={`${cardClass} p-5`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-sm">{msg.author?.name}</span>
              <span className="text-xs text-slate-500">({msg.author?.role})</span>
              <span className="text-xs text-slate-400 ml-auto">{new Date(msg.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm">{msg.content}</p>
          </div>
        ))}
        {publicMessages.length === 0 && <p className="text-slate-500 text-center py-4">No announcements yet.</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button onClick={() => fetchData(page - 1)} disabled={page <= 1} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Previous</button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button onClick={() => fetchData(page + 1)} disabled={page >= totalPages} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Next</button>
        </div>
      )}
    </div>
  );
}
