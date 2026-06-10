'use client';
import { useState, useEffect, useCallback } from 'react';
import { Check, X, Search, Filter, GraduationCap, Users, UserCheck, ShieldAlert, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminApprovals() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [appRes, deptRes] = await Promise.all([
        fetch('/api/admin/approvals').then(r => r.json()),
        fetch('/api/departments').then(r => r.json()),
      ]);
      setPendingUsers(appRes.pendingUsers || []);
      setDepartments(deptRes.departments || []);
    } catch (e) {
      console.error('Failed to fetch approvals data:', e);
      toast.error('Failed to load pending registrations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateStatus = async (userId, status, name) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus: status })
      });
      if (res.ok) {
        toast.success(`User ${name} has been ${status.toLowerCase()}`);
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || `Failed to update status for ${name}`);
      }
    } catch (e) {
      console.error(e);
      toast.error('An error occurred during updating status');
    }
  };

  // Filter logic
  const filteredUsers = pendingUsers.filter(u => {
    const nameMatch = u.name.toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = u.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check rollNo or employeeId depending on role
    let idMatch = false;
    if (u.role === 'STUDENT' && u.student) {
      idMatch = u.student.rollNo?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    } else if (u.role === 'FACULTY' && u.faculty) {
      idMatch = u.faculty.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    }

    const searchMatch = nameMatch || emailMatch || idMatch;

    const roleMatch = roleFilter === 'ALL' || u.role === roleFilter;

    let deptMatch = false;
    if (deptFilter === 'ALL') {
      deptMatch = true;
    } else {
      const uDeptId = u.role === 'STUDENT' ? u.student?.departmentId : u.faculty?.departmentId;
      deptMatch = uDeptId === deptFilter;
    }

    return searchMatch && roleMatch && deptMatch;
  });

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold">Pending Approvals</h2>
        <p className="text-slate-500 text-sm">Review, approve, or reject new registrations for students and faculty.</p>
      </div>

      {/* Filters & Search controls */}
      <div className={`${cardClass} p-4 flex flex-col md:flex-row gap-4 justify-between items-center`}>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-logo-teal/20 focus:border-logo-teal transition"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 w-full sm:w-auto">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="FACULTY">Faculty</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 w-full sm:w-auto">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Branch:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none max-w-[180px] truncate"
            >
              <option value="ALL">All Branches</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className={`${cardClass} overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse">Loading pending registrations...</div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-medium">
                  <th className="p-4">User Details</th>
                  <th className="p-4">Role / Branch</th>
                  <th className="p-4">Identifier</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredUsers.map(u => {
                  const regDate = new Date(u.createdAt).toLocaleDateString('default', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  const isStudent = u.role === 'STUDENT';
                  const deptName = isStudent ? u.student?.department?.name : u.faculty?.department?.name;
                  const identifier = isStudent ? u.student?.rollNo : u.faculty?.employeeId;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            isStudent 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' 
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                          }`}>
                            {u.role}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{deptName || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                          {identifier || '—'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {regDate}
                        </div>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleUpdateStatus(u.id, 'APPROVED', u.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                          title="Approve User"
                        >
                          <Check size={14} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(u.id, 'REJECTED', u.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs font-bold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                          title="Reject User"
                        >
                          <X size={14} />
                          Reject
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
              <UserCheck size={20} />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All caught up!</p>
            <p className="text-xs text-slate-400 max-w-xs">There are no pending registrations matching your selection.</p>
          </div>
        )}
      </div>
    </div>
  );
}
