'use client';
import { useState, useEffect, useCallback } from 'react';
import { Check, Key, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFaculty() {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [facRes, deptRes] = await Promise.all([
        fetch('/api/faculty').then(r => r.json()),
        fetch('/api/departments').then(r => r.json()),
      ]);
      setFaculty(facRes.faculty || []);
      setDepartments(deptRes.departments || []);
    } catch (e) {
      console.error(e);
    }
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
    if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters.');
    const res = await fetch(`/api/users/${userId}/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword }) });
    const data = await res.json();
    if (res.ok) toast.success(data.message);
    else toast.error(data.message);
  };

  if (loading) return <div className="text-slate-500 py-8">Loading faculty...</div>;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold">Faculty</h2>
      <div className={`${cardClass} overflow-hidden`}>
        <table className="w-full text-left text-sm">
          <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500">
            <th className="p-4 font-medium">Faculty</th><th className="p-4 font-medium">Employee ID</th>
            <th className="p-4 font-medium">Assigned Branch</th><th className="p-4 font-medium">Status</th>
            <th className="p-4 font-medium text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {faculty.map(f => (
              <tr key={f.id} className={f.user?.isBlocked ? 'opacity-50 bg-slate-50 dark:bg-slate-800/30' : ''}>
                <td className="p-4"><div className="font-medium">{f.user?.name}</div><div className="text-xs text-slate-500">{f.user?.email}</div></td>
                <td className="p-4 text-slate-500">{f.employeeId}</td>
                <td className="p-4">
                  <select className="border rounded p-1 text-xs dark:bg-slate-700 dark:border-slate-600" value={f.departmentId || ''} onChange={(e) => handleUpdateUser(f.userId, { facultyDepartmentId: e.target.value })}>
                    <option value="">Unassigned</option>
                    {departments.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                  </select>
                </td>
                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${f.user?.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{f.user?.approvalStatus}</span></td>
                <td className="p-4 text-right space-x-1">
                  {f.user?.approvalStatus === 'PENDING' && <button onClick={() => handleUpdateUser(f.userId, { approvalStatus: 'APPROVED' })} className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"><Check className="w-4 h-4" /></button>}
                  <button onClick={() => handleResetPassword(f.userId)} className="p-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200" title="Reset Password"><Key className="w-4 h-4" /></button>
                  <button onClick={() => handleUpdateUser(f.userId, { isBlocked: !f.user?.isBlocked })} className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200" title="Block/Unblock"><ShieldAlert className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
