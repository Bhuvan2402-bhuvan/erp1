'use client';
import { useState, useEffect, useCallback } from 'react';
import { Star, Key, Check, X, ShieldAlert, UserCheck, Users, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FacultyBranch() {
  const [dbUser, setDbUser] = useState(null);
  const [branchStudents, setBranchStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'PENDING', 'APPROVED'
  const [searchQuery, setSearchQuery] = useState('');

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
      if (updateData.approvalStatus === 'APPROVED') {
        toast.success('Volunteer approved & confirmation email sent! 📧');
      } else if (updateData.approvalStatus === 'REJECTED') {
        toast.success('Registration rejected');
      } else {
        toast.success('Updated successfully');
      }
      fetchData();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.message || 'Failed to update user');
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

  if (loading || !dbUser) return <div className="text-slate-500 py-8 text-center animate-pulse">Loading branch volunteers & pending signups...</div>;

  const pendingStudents = branchStudents.filter(s => s.user?.approvalStatus === 'PENDING');
  const approvedStudents = branchStudents.filter(s => s.user?.approvalStatus === 'APPROVED');

  const filteredStudents = branchStudents.filter(s => {
    if (activeTab === 'PENDING' && s.user?.approvalStatus !== 'PENDING') return false;
    if (activeTab === 'APPROVED' && s.user?.approvalStatus !== 'APPROVED') return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = s.user?.name?.toLowerCase().includes(q);
      const emailMatch = s.user?.email?.toLowerCase().includes(q);
      const rollMatch = s.rollNo?.toLowerCase().includes(q);
      return nameMatch || emailMatch || rollMatch;
    }
    return true;
  });

  const cardClass = 'bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-logo-teal" />
            Branch Volunteers & Signups
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {dbUser.faculty?.department?.name || 'Department Branch'} — {branchStudents.length} total students
          </p>
        </div>

        {/* Tab Badges */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-2xl">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${activeTab === 'ALL' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
          >
            All ({branchStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${activeTab === 'PENDING' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-600 dark:text-amber-400 hover:bg-amber-100/50'}`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Pending ({pendingStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${activeTab === 'APPROVED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/50'}`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Approved ({approvedStudents.length})
          </button>
        </div>
      </div>

      {/* Pending Banner Alert if pending signups exist */}
      {pendingStudents.length > 0 && activeTab !== 'PENDING' && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between gap-4 text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm font-medium">
              You have <strong className="font-extrabold">{pendingStudents.length} pending student signup request(s)</strong> awaiting branch approval.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('PENDING')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shrink-0 transition"
          >
            Review Pending &rarr;
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search by student name, email, or roll no..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-logo-teal text-slate-900 dark:text-white"
        />
      </div>

      {/* Volunteers Table */}
      <div className={`${cardClass} overflow-hidden`}>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4 font-semibold">Volunteer</th>
              <th className="p-4 font-semibold">Roll No</th>
              <th className="p-4 font-semibold">Year / Sec</th>
              <th className="p-4 font-semibold">Approval Status</th>
              <th className="p-4 font-semibold">Coordinator</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredStudents.map(m => {
              const status = m.user?.approvalStatus || 'PENDING';
              return (
                <tr key={m.id} className={m.user?.isBlocked ? 'opacity-50' : 'hover:bg-slate-50/50 dark:hover:bg-slate-700/30'}>
                  <td className="p-4">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      {m.user?.name}
                      {m.isCoordinator && <Star className="w-4 h-4 text-amber-500 fill-amber-500" title="Student Coordinator" />}
                    </div>
                    <div className="text-xs text-slate-500">{m.user?.email}</div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300 font-mono text-xs font-bold">{m.rollNo}</td>
                  <td className="p-4 text-slate-500">Y{m.year} / {m.section}</td>
                  <td className="p-4">
                    {status === 'APPROVED' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Approved
                      </span>
                    ) : status === 'REJECTED' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                        Rejected
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                        Pending Approval
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {m.isCoordinator ? (
                      <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded text-xs font-extrabold">Coordinator</span>
                    ) : (
                      <span className="text-slate-400 text-xs">No</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-1.5">
                    {status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleUpdateUser(m.userId, { approvalStatus: 'APPROVED' })}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition inline-flex items-center gap-1"
                          title="Approve Volunteer Signup"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleUpdateUser(m.userId, { approvalStatus: 'REJECTED' })}
                          className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition inline-flex items-center gap-1"
                          title="Reject Registration"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {status === 'APPROVED' && (
                      <button
                        onClick={() => handleUpdateUser(m.userId, { isCoordinator: !m.isCoordinator })}
                        className={`p-1.5 rounded-lg transition ${m.isCoordinator ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                        title={m.isCoordinator ? 'Demote from Coordinator' : 'Make Student Coordinator'}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleResetPassword(m.userId)}
                      className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 transition"
                      title="Reset Password"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-500">
                  No volunteers found in this branch matching your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
