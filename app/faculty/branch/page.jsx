'use client';
import { useState, useEffect, useCallback } from 'react';
import { Star, Key } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FacultyBranch() {
  const [dbUser, setDbUser] = useState(null);
  const [branchStudents, setBranchStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const meRes = await fetch('/api/auth/me').then(r => r.json());
    if (!meRes.user) {
      setLoading(false);
      return;
    }
    
    setDbUser(meRes.user);
    const facultyDeptId = meRes.user.faculty?.departmentId;

    const studentsRes = await fetch(`/api/students?limit=200${facultyDeptId ? `&departmentId=${facultyDeptId}` : ''}`).then(r => r.json());
    setBranchStudents(studentsRes.students || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateUser = async (userId, updateData) => {
    const res = await fetch(`/api/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateData) });
    if (res.ok) {
      toast.success('Updated successfully');
      fetchData();
    } else {
      toast.error('Failed to update');
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter a new 6+ character password:');
    if (!newPassword || newPassword.length < 6) return toast.error('Min 6 characters.');
    const res = await fetch(`/api/users/${userId}/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword }) });
    const data = await res.json();
    if (res.ok) toast.success(data.message);
    else toast.error(data.message);
  };

  if (loading || !dbUser) return <div className="text-slate-500 py-8">Loading branch data...</div>;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Branch Volunteers</h2>
          <p className="text-sm text-slate-500">{dbUser.faculty?.department?.name} — {branchStudents.length} volunteers</p>
        </div>
      </div>
      <div className={`${cardClass} overflow-hidden`}>
        <table className="w-full text-left text-sm">
          <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500">
            <th className="p-4 font-medium">Volunteer</th>
            <th className="p-4 font-medium">Roll No</th>
            <th className="p-4 font-medium">Year / Sec</th>
            <th className="p-4 font-medium">Coordinator</th>
            <th className="p-4 font-medium text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {branchStudents.map(m => (
              <tr key={m.id} className={m.user?.isBlocked ? 'opacity-50' : ''}>
                <td className="p-4">
                  <div className="font-medium flex items-center gap-2">{m.user?.name} {m.isCoordinator && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}</div>
                  <div className="text-xs text-slate-500">{m.user?.email}</div>
                </td>
                <td className="p-4 text-slate-500">{m.rollNo}</td>
                <td className="p-4 text-slate-500">Y{m.year} / {m.section}</td>
                <td className="p-4">{m.isCoordinator ? <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">Yes</span> : 'No'}</td>
                <td className="p-4 text-right space-x-1">
                  <button onClick={() => handleUpdateUser(m.userId, { isCoordinator: !m.isCoordinator })} className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" title="Toggle Coordinator"><Star className="w-4 h-4" /></button>
                  <button onClick={() => handleResetPassword(m.userId)} className="p-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200" title="Reset Password"><Key className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {branchStudents.length === 0 && <tr><td colSpan="5" className="py-8 text-center text-slate-500">No volunteers in your branch yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
