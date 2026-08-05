'use client';
import { useState, useEffect, useCallback } from 'react';
import { Check, Key, ShieldAlert, X, ArrowUpDown, Search, Filter, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFaculty() {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (departmentFilter) params.append('departmentId', departmentFilter);
      if (sortBy) params.append('sortBy', sortBy);

      const [facRes, deptRes] = await Promise.all([
        fetch(`/api/faculty?${params.toString()}`).then(r => r.json()),
        fetch('/api/departments').then(r => r.json()),
      ]);
      setFaculty(facRes.faculty || []);
      setDepartments(deptRes.departments || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [departmentFilter, sortBy]);

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

  // Local search filter
  const filteredFaculty = faculty.filter(f => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = f.user?.name?.toLowerCase() || '';
    const email = f.user?.email?.toLowerCase() || '';
    const empId = f.employeeId?.toLowerCase() || '';
    const dept = f.department?.name?.toLowerCase() || f.department?.code?.toLowerCase() || '';
    return name.includes(q) || email.includes(q) || empId.includes(q) || dept.includes(q);
  });

  const cardClass = 'bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-logo-teal" /> Faculty Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage faculty accounts, assign department branches, and set access permissions.</p>
        </div>

        <div className="bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <span>Total Faculty:</span>
          <span className="bg-logo-teal text-white px-2 py-0.5 rounded-full text-xs font-extrabold">{filteredFaculty.length}</span>
        </div>
      </div>

      {/* Toolbar: Search, Branch Filter & Sort By Dropdown */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-logo-teal text-slate-900 dark:text-white font-medium"
          />
        </div>

        {/* Branch Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-logo-teal text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="">All Branches</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>

        {/* Sort By Dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-logo-teal shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-logo-teal text-slate-900 dark:text-white font-bold"
          >
            <option value="name-asc">Sort: Name (A to Z)</option>
            <option value="name-desc">Sort: Name (Z to A)</option>
            <option value="emp-asc">Sort: Employee ID (Asc)</option>
            <option value="emp-desc">Sort: Employee ID (Desc)</option>
            <option value="status">Sort: Approval Status</option>
            <option value="department">Sort: Assigned Branch</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={`${cardClass} overflow-hidden shadow-xs`}>
        {loading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse">Loading faculty records...</div>
        ) : filteredFaculty.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No faculty members found matching your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                  <th className="p-4">Faculty Name & Email</th>
                  <th className="p-4">Employee ID</th>
                  <th className="p-4">Assigned Branch</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredFaculty.map(f => (
                  <tr key={f.id} className={f.user?.isBlocked ? 'opacity-50 bg-slate-50 dark:bg-slate-800/30' : 'hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition'}>
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{f.user?.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{f.user?.email}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-300 font-semibold">{f.employeeId || 'N/A'}</td>
                    <td className="p-4">
                      <select
                        className="border rounded-xl px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-700 dark:border-slate-600 font-semibold focus:outline-none focus:ring-2 focus:ring-logo-teal text-slate-800 dark:text-slate-200"
                        value={f.departmentId || ''}
                        onChange={(e) => handleUpdateUser(f.userId, { facultyDepartmentId: e.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        f.user?.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        f.user?.approvalStatus === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                        'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                      }`}>
                        {f.user?.approvalStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5">
                      {f.user?.approvalStatus === 'PENDING' && (
                        <>
                          <button onClick={() => handleUpdateUser(f.userId, { approvalStatus: 'APPROVED' })} className="p-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-xl transition" title="Approve"><Check className="w-4 h-4" /></button>
                          <button onClick={() => handleUpdateUser(f.userId, { approvalStatus: 'REJECTED' })} className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl transition" title="Reject"><X className="w-4 h-4" /></button>
                        </>
                      )}
                      <button onClick={() => handleResetPassword(f.userId)} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-xl transition" title="Reset Password"><Key className="w-4 h-4" /></button>
                      <button onClick={() => handleUpdateUser(f.userId, { isBlocked: !f.user?.isBlocked })} className="p-2 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 hover:bg-red-200 rounded-xl transition" title="Block/Unblock"><ShieldAlert className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
