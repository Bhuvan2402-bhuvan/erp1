'use client';
import { useState, useEffect, useCallback } from 'react';
import { Download, Star, Check, Key, ShieldAlert, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminVolunteers() {
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsTotalPages, setStudentsTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchFaculty = useCallback(async () => {
    try {
      const res = await fetch('/api/faculty');
      const data = await res.json();
      setFaculty(data.faculty || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchStudents = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students?page=${page}&limit=20`);
      const data = await res.json();
      setStudents(data.students || []);
      setStudentsPage(data.pagination?.page || 1);
      setStudentsTotalPages(data.pagination?.totalPages || 1);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFaculty();
    fetchDepartments();
    fetchStudents(1);
  }, [fetchFaculty, fetchDepartments, fetchStudents]);

  const handleUpdateUser = async (userId, updateData) => {
    const res = await fetch(`/api/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateData) });
    if (res.ok) {
      toast.success('Updated successfully');
      fetchStudents(studentsPage);
    } else {
      toast.error('Failed to update');
    }
  };

  const handleDeleteVolunteer = async (userId, name) => {
    if (!confirm(`Permanently delete "${name}"?\n\nThis will remove all their data including attendance, issues and certificates. This action cannot be undone.`)) return;
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      toast.success(`${name} deleted successfully`);
      fetchStudents(studentsPage);
    } else {
      toast.error(data.message || 'Failed to delete volunteer');
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

  const handleExportAttendance = () => {
    window.open(`/api/attendance/export?departmentId=`, '_blank');
  };

  if (loading && students.length === 0) return <div className="text-slate-500 py-8">Loading volunteers...</div>;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';
  const btnPrimary = 'px-4 py-2 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-lg hover:opacity-90 transition text-sm font-medium shadow-sm';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-3xl font-bold">Volunteers</h2><p className="text-slate-500 text-sm">Manage volunteers, assign coordinators, block/unblock.</p></div>
        <button onClick={handleExportAttendance} className={btnPrimary + ' flex items-center gap-2'}><Download className="w-4 h-4" /> Export All Attendance</button>
      </div>
      <div className={`${cardClass} overflow-hidden`}>
        <table className="w-full text-left text-sm">
          <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500">
            <th className="p-4 font-medium">Volunteer</th>
            <th className="p-4 font-medium">Branch</th>
            <th className="p-4 font-medium">Mentor</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 font-medium text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {students.map(s => (
              <tr key={s.id} className={s.user?.isBlocked ? 'opacity-50 bg-slate-50 dark:bg-slate-800/30' : ''}>
                <td className="p-4">
                  <div className="font-medium flex items-center gap-2">
                    {s.user?.name} {s.isCoordinator && <Star className="w-4 h-4 text-amber-500 fill-amber-500" title="Coordinator" />}
                  </div>
                  <div className="text-xs text-slate-500">{s.rollNo} • {s.user?.email}</div>
                </td>
                <td className="p-4 text-sm">
                  {s.isCoordinator ? (
                    <select
                      className="border rounded p-1 text-xs dark:bg-slate-700 dark:border-slate-600 max-w-[160px]"
                      value={s.departmentId || ''}
                      title="Change branch (coordinators only)"
                      onChange={(e) => {
                        if (!e.target.value) return;
                        handleUpdateUser(s.userId, { departmentId: e.target.value });
                      }}
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span>{s.department?.name}</span>
                  )}
                </td>
                <td className="p-4 text-sm">
                  <select className="border rounded p-1 text-xs dark:bg-slate-700 dark:border-slate-600" value={s.mentorId || ''} onChange={(e) => handleUpdateUser(s.userId, { mentorId: e.target.value || 'null' })}>
                    <option value="">Unassigned</option>
                    {faculty.filter(f => f.departmentId === s.departmentId).map(f => (<option key={f.id} value={f.id}>{f.user?.name}</option>))}
                  </select>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.user?.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : s.user?.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{s.user?.approvalStatus}</span>
                </td>
                <td className="p-4 text-right space-x-1">
                  {s.user?.approvalStatus === 'PENDING' && (
                    <>
                      <button onClick={() => handleUpdateUser(s.userId, { approvalStatus: 'APPROVED' })} className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200" title="Approve"><Check className="w-4 h-4" /></button>
                      <button onClick={() => handleUpdateUser(s.userId, { approvalStatus: 'REJECTED' })} className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200" title="Reject"><X className="w-4 h-4" /></button>
                    </>
                  )}
                  <button onClick={() => handleUpdateUser(s.userId, { isCoordinator: !s.isCoordinator })} className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" title="Toggle Coordinator"><Star className="w-4 h-4" /></button>
                  <button onClick={() => handleResetPassword(s.userId)} className="p-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200" title="Reset Password"><Key className="w-4 h-4" /></button>
                  <button onClick={() => handleUpdateUser(s.userId, { isBlocked: !s.user?.isBlocked })} className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200" title="Block/Unblock"><ShieldAlert className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteVolunteer(s.userId, s.user?.name)} className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700" title="Delete Volunteer"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {studentsPage} of {studentsTotalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => fetchStudents(studentsPage - 1)} disabled={studentsPage <= 1} className="px-3 py-1 rounded border text-sm disabled:opacity-50 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Previous</button>
            <button onClick={() => fetchStudents(studentsPage + 1)} disabled={studentsPage >= studentsTotalPages} className="px-3 py-1 rounded border text-sm disabled:opacity-50 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
