'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

const ChatBox = dynamic(() => import('@/components/ChatBox'), {
  loading: () => <div className="flex-1 flex items-center justify-center text-slate-500 animate-pulse">Loading chat...</div>,
});

export default function AdminChat() {
  const [dbUser, setDbUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [chatUsers, setChatUsers] = useState([]);
  const [chatTarget, setChatTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [meRes, studentsRes, facultyRes] = await Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch(`/api/students?limit=200`).then(r => r.json()),
      fetch('/api/faculty').then(r => r.json())
    ]);

    const activeUser = meRes.user;
    setDbUser(activeUser);
    
    const loadedStudents = studentsRes.students || [];
    const loadedFaculty = facultyRes.faculty || [];
    setStudents(loadedStudents);
    setFaculty(loadedFaculty);

    // Populate contacts on initial load
    const allList = [
      ...loadedStudents.map(s => ({ id: s.userId, name: s.user?.name, email: s.user?.email, role: s.isCoordinator ? 'COORDINATOR' : 'VOLUNTEER', dept: s.department?.name })),
      ...loadedFaculty.map(f => ({ id: f.userId, name: f.user?.name, email: f.user?.email, role: 'FACULTY', dept: f.department?.name }))
    ];
    setChatUsers(allList);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !dbUser) return <div className="text-slate-500 py-8">Loading chat...</div>;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';

  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 120px)' }}>
      <div className={`${cardClass} p-4 overflow-y-auto`}>
        <h3 className="font-semibold mb-3">All Users</h3>
        <input
          placeholder="Search..."
          className="w-full px-3 py-2 border rounded-lg text-sm mb-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          onChange={(e) => {
            const q = e.target.value.toLowerCase();
            const allList = [...students.map(s => ({ id: s.userId, name: s.user?.name, email: s.user?.email, role: s.isCoordinator ? 'COORDINATOR' : 'VOLUNTEER', dept: s.department?.name })), ...faculty.map(f => ({ id: f.userId, name: f.user?.name, email: f.user?.email, role: 'FACULTY', dept: f.department?.name }))];
            setChatUsers(q ? allList.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)) : allList);
          }}
        />
        <div className="space-y-1">
          {chatUsers.map(u => (
            <button key={u.id} onClick={() => setChatTarget(u)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${chatTarget?.id === u.id ? 'bg-logo-teal/10 dark:bg-logo-teal/20 text-logo-teal' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
              <p className="font-medium">{u.name}</p>
              <p className="text-xs text-slate-500">{u.role} • {u.dept}</p>
            </button>
          ))}
          {chatUsers.length === 0 && <p className="text-xs text-slate-500 py-4">No contacts found</p>}
        </div>
      </div>
      <div className={`${cardClass} md:col-span-2 overflow-hidden flex flex-col`}>
        <ChatBox currentUser={dbUser} targetUser={chatTarget} />
      </div>
    </div>
  );
}
