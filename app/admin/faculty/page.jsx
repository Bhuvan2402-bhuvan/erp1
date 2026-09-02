'use client';
import { useState, useEffect, useCallback } from 'react';
import { Check, Key, ShieldAlert, X, ArrowUpDown, Search, Filter, GraduationCap, Pencil, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFaculty() {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [renamingFaculty, setRenamingFaculty] = useState(null); // { userId, currentName }
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

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
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateData) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (updateData.name !== undefined) {
          toast.success(`Faculty renamed to "${updateData.name}"`);
        } else if (updateData.facultyDepartmentId !== undefined) {
          toast.success(updateData.facultyDepartmentId ? 'Branch assigned successfully' : 'Branch unassigned');
        } else {
          toast.success('Updated successfully');
        }
        fetchData();
      } else {
        toast.error(data.message || 'Failed to update');
      }
    } catch {
      toast.error('Network error updating faculty');
    }
  };

  const handleOpenRename = (f) => {
    setRenamingFaculty({ userId: f.userId, currentName: f.user?.name || '' });
    setNewName(f.user?.name || '');
  };

  const handleSaveRename = async () => {
    if (!newName.trim() || newName.trim().length < 2) {
      return toast.error('Name must be at least 2 characters.');
    }
    setSavingName(true);
    await handleUpdateUser(renamingFaculty.userId, { name: newName.trim() });
    setSavingName(false);
    setRenamingFaculty(null);
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
          <p className="text-xs text-slate-400 mt-1">Manage faculty accounts, rename coordinators, assign department branches, and set access permissions.</p>
        </div>

        <div className="bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <span>Total Faculty:</span>
          <span className="bg-logo-teal text-white px-2 py-0.5 rounded-full text-xs font-extrabold">{filteredFaculty.length}</span>
        </div>
      </div>

      {/* Rename Modal */}
      {renamingFaculty && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
                <Pencil className="w-4 h-4 text-logo-teal" /> Rename Faculty Coordinator
              </h3>
              <button onClick={() => setRenamingFaculty(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Faculty Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dr. K. Srinivasan"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-logo-teal text-slate-900 dark:text-white font-semibold"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(); }}
                />
              </div>
              <p className="text-[11px] text-slate-400">Updates the faculty coordinator&apos;s display name across all dashboards, visitor directory, and certificates.</p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setRenamingFaculty(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRename}
                disabled={savingName}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-logo-navy to-logo-teal text-white hover:opacity-90 transition disabled:opacity-60 flex items-center gap-1.5 shadow-sm"
              >
                {savingName ? 'Saving...' : <><Check className="w-3.5 h-3.5" /> Save Name</>}
              </button>
            </div>
          </div>
        </div>
      )}

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
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{f.user?.name}</span>
                        <button
                          onClick={() => handleOpenRename(f)}
                          className="p-1 text-slate-400 hover:text-logo-teal dark:hover:text-logo-teal rounded transition"
                          title="Rename Faculty Coordinator"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                      <button onClick={() => handleOpenRename(f)} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-xl transition" title="Rename"><Pencil className="w-4 h-4" /></button>
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

