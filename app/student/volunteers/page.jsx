'use client';
import { useState, useEffect, useCallback } from 'react';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function CoordinatorVolunteers() {
  const router = useRouter();
  const [branchVolunteers, setBranchVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCoordinator, setIsCoordinator] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [meRes, studentsRes] = await Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/students?limit=200').then(r => r.json()),
    ]);

    const user = meRes.user;
    if (!user || !user.student?.isCoordinator) {
      router.push('/student');
      return;
    }
    
    setIsCoordinator(true);
    const myStudentId = user.student.id;
    const branchMates = (studentsRes.students || []).filter(s => s.departmentId === user.student.departmentId && s.id !== myStudentId);
    setBranchVolunteers(branchMates);
    setLoading(false);
  }, [router]);

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

  if (loading || !isCoordinator) return <div className="text-slate-500 py-8">Loading volunteers...</div>;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Branch Volunteers</h2>
      <div className={`${cardClass} overflow-hidden`}>
        <table className="w-full text-left text-sm">
          <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500">
            <th className="p-4 font-medium">Name</th><th className="p-4 font-medium">Roll No</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {branchVolunteers.map(v => (
              <tr key={v.id} className={v.user?.isBlocked ? 'opacity-50' : ''}>
                <td className="p-4 font-medium">{v.user?.name}</td>
                <td className="p-4 text-slate-500">{v.rollNo}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${v.user?.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{v.user?.approvalStatus}</span></td>
                <td className="p-4 text-right space-x-1">
                  {v.user?.approvalStatus === 'PENDING' && (
                    <button onClick={() => handleUpdateUser(v.userId, { approvalStatus: 'APPROVED' })} className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200" title="Approve Volunteer"><Check className="w-4 h-4" /></button>
                  )}
                </td>
              </tr>
            ))}
            {branchVolunteers.length === 0 && (
              <tr><td colSpan="4" className="p-4 text-center text-slate-500">No volunteers found in your branch.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
