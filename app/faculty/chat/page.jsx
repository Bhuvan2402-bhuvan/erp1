'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

const ChatBox = dynamic(() => import('@/components/ChatBox'), {
  loading: () => <div className="flex-1 flex items-center justify-center text-slate-500 animate-pulse">Loading chat...</div>,
});

export default function FacultyChat() {
  const [dbUser, setDbUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [chatTarget, setChatTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [meRes, contactsRes] = await Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/chat/contacts').then(r => r.json())
    ]);

    setDbUser(meRes.user);
    setAllUsers(contactsRes.contacts || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !dbUser) return <div className="text-slate-500 py-8">Loading chat...</div>;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';

  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 200px)' }}>
      <div className={`${cardClass} p-4 overflow-y-auto`}>
        <h3 className="font-semibold mb-3">Contacts</h3>
        <div className="space-y-1">
          {allUsers.map(u => (
            <button key={u.id} onClick={() => setChatTarget(u)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${chatTarget?.id === u.id ? 'bg-logo-teal/10 dark:bg-logo-teal/20 text-logo-teal' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
              <p className="font-medium">{u.name}</p>
              <p className="text-xs text-slate-500">{u.role}</p>
            </button>
          ))}
          {allUsers.length === 0 && <p className="text-xs text-slate-500 py-4">No contacts found.</p>}
        </div>
      </div>
      <div className={`${cardClass} md:col-span-2 overflow-hidden flex flex-col`}>
        <ChatBox currentUser={dbUser} targetUser={chatTarget} />
      </div>
    </div>
  );
}
