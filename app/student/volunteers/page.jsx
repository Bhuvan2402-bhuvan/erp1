'use client';
import { useState, useEffect, useCallback } from 'react';
import { Check, Star, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function CoordinatorVolunteers() {
  const router = useRouter();
  const [branchVolunteers, setBranchVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCoordinator, setIsCoordinator] = useState(false);

  // Modals state
  const [pointsModalStudent, setPointsModalStudent] = useState(null);
  const [pointsAmount, setPointsAmount] = useState('10');
  const [pointsReason, setPointsReason] = useState('');

  const [warningModalStudent, setWarningModalStudent] = useState(null);
  const [warningReason, setWarningReason] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleAwardPoints = async (e) => {
    e.preventDefault();
    if (!pointsModalStudent || !pointsAmount || !pointsReason) {
      toast.error('Points amount and reason are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: pointsModalStudent.id,
          points: pointsAmount,
          reason: pointsReason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message);
      setPointsModalStudent(null);
      setPointsReason('');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to award points');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueWarning = async (e) => {
    e.preventDefault();
    if (!warningModalStudent || !warningReason) {
      toast.error('Warning reason is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/warnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: warningModalStudent.id,
          reason: warningReason,
          proofUrl: proofUrl || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message);
      setWarningModalStudent(null);
      setWarningReason(''); setProofUrl('');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to issue warning');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !isCoordinator) return <div className="text-slate-500 py-8">Loading volunteers...</div>;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Branch Volunteers & Point Allocation</h2>
      </div>
      
      <div className={`${cardClass} overflow-hidden`}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Roll No</th>
              <th className="p-4 font-medium">Points</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {branchVolunteers.map(v => (
              <tr key={v.id} className={v.user?.isBlocked ? 'opacity-50' : ''}>
                <td className="p-4 font-medium">{v.user?.name}</td>
                <td className="p-4 text-slate-500 font-mono text-xs">{v.rollNo}</td>
                <td className="p-4 font-extrabold text-logo-teal">{v.points || 0} pts</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${v.user?.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {v.user?.approvalStatus}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  {v.user?.approvalStatus === 'PENDING' && (
                    <button onClick={() => handleUpdateUser(v.userId, { approvalStatus: 'APPROVED' })} className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200" title="Approve Volunteer">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => { setPointsModalStudent(v); setPointsAmount('10'); setPointsReason(''); }}
                    className="px-3 py-1 bg-logo-teal/10 text-logo-teal hover:bg-logo-teal hover:text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                  >
                    <Star className="w-3.5 h-3.5" /> Allot Points
                  </button>
                  <button
                    onClick={() => { setWarningModalStudent(v); setWarningReason(''); setProofUrl(''); }}
                    className="px-3 py-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Warning
                  </button>
                </td>
              </tr>
            ))}
            {branchVolunteers.length === 0 && (
              <tr><td colSpan="5" className="p-4 text-center text-slate-500">No volunteers found in your branch.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Award Points Modal */}
      {pointsModalStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-2">Award Performance Points</h3>
            <p className="text-xs text-slate-400 mb-4">Volunteer: <span className="font-bold text-slate-700 dark:text-slate-200">{pointsModalStudent.user?.name}</span></p>

            <form onSubmit={handleAwardPoints} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Points Amount</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={pointsAmount}
                  onChange={e => setPointsAmount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-logo-teal font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Reason / Campaign Work</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Excellent coordination during Mega Blood Drive"
                  value={pointsReason}
                  onChange={e => setPointsReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-logo-teal"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setPointsModalStudent(null)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-logo-teal text-white text-xs font-bold rounded-xl shadow hover:opacity-90 transition">
                  {submitting ? 'Awarding...' : 'Confirm Points'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Warning Modal */}
      {warningModalStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-2 text-amber-600">Issue Warning Notice</h3>
            <p className="text-xs text-slate-400 mb-4">Volunteer: <span className="font-bold text-slate-700 dark:text-slate-200">{warningModalStudent.user?.name}</span></p>

            <form onSubmit={handleIssueWarning} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Warning Reason / Misconduct</label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Absent without notice / Proxy QR scan attempt"
                  value={warningReason}
                  onChange={e => setWarningReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Proof URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={proofUrl}
                  onChange={e => setProofUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setWarningModalStudent(null)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl shadow hover:opacity-90 transition">
                  {submitting ? 'Issuing...' : 'Send Official Warning'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
