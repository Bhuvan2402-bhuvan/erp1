'use client';
import { useState, useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';

export default function AdminBranches() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExportAttendance = (deptId) => {
    window.open(`/api/attendance/export?departmentId=${deptId || ''}`, '_blank');
  };

  if (loading) return <div className="text-slate-500 py-8">Loading branches...</div>;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold">Branches</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map(d => (
          <div key={d.id} className={`${cardClass} p-6`}>
            <h3 className="font-bold text-lg mb-1">{d.name}</h3>
            <p className="text-sm text-slate-500 mb-3 font-mono">{d.code}</p>
            <div className="flex gap-4 text-sm mb-4">
              <div className="text-center"><p className="text-xl font-bold text-logo-teal">{d._count?.students ?? 0}</p><p className="text-slate-500 text-xs">Volunteers</p></div>
              <div className="text-center"><p className="text-xl font-bold text-emerald-600">{d._count?.faculty ?? 0}</p><p className="text-slate-500 text-xs">Faculty</p></div>
            </div>
            <button onClick={() => handleExportAttendance(d.id)} className="text-xs text-logo-teal hover:underline flex items-center gap-1"><Download className="w-3 h-3" /> Export Attendance</button>
          </div>
        ))}
      </div>
    </div>
  );
}
