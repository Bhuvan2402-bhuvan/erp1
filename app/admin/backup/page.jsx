'use client';
import { useState } from 'react';
import { Download, Database, FileSpreadsheet, Archive, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function BackupHubPage() {
  const [downloading, setDownloading] = useState(null);

  const triggerDownload = async (type, filename) => {
    setDownloading(type);
    try {
      const res = await fetch(`/api/backup?type=${type}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data.backup, null, 2)
      )}`;

      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success(`${filename} exported successfully!`);
    } catch (err) {
      toast.error(err.message || 'Backup download failed');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-logo-navy via-slate-900 to-logo-teal text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -z-0" />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-6 h-6 text-logo-teal" />
            <h1 className="text-2xl font-extrabold tracking-tight">System Data Backup & Storage Hub</h1>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            Store, archive, and export complete offline backups for financial ledgers, documentations, event activity reports, and audited student attendance logs.
          </p>
        </div>
      </div>

      {/* Backup Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full System Backup */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-md flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-logo-teal/10 text-logo-teal flex items-center justify-center mb-4">
              <Archive className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-1">Full ERP Database Backup Bundle</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Export complete JSON snapshot containing all system tables: documentations, financial transactions, campaign reports, and volunteer attendance logs.
            </p>
          </div>
          <button
            onClick={() => triggerDownload('all', `system_full_backup_${new Date().toISOString().slice(0,10)}.json`)}
            disabled={downloading === 'all'}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-logo-navy to-logo-teal text-white font-bold text-xs rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading === 'all' ? 'Generating Backup...' : 'Download Full System Backup (.JSON)'}
          </button>
        </div>

        {/* Financial Backup */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-md flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-1">Finance Ledger Backup</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Export income, expense, and budget audit trail with creator timestamps and category breakdowns.
            </p>
          </div>
          <button
            onClick={() => triggerDownload('finance', `finance_backup_${new Date().toISOString().slice(0,10)}.json`)}
            disabled={downloading === 'finance'}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 dark:bg-slate-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading === 'finance' ? 'Exporting Finance Data...' : 'Export Finance Records (.JSON)'}
          </button>
        </div>

        {/* Documentation Archive */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-md flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-1">Documentation & Reports Archive</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Export documentation index, event reports list, circular notices, and file reference URLs.
            </p>
          </div>
          <button
            onClick={() => triggerDownload('documentation', `documentation_backup_${new Date().toISOString().slice(0,10)}.json`)}
            disabled={downloading === 'documentation'}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 dark:bg-slate-700 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading === 'documentation' ? 'Exporting Docs...' : 'Export Documentations (.JSON)'}
          </button>
        </div>

        {/* Student Attendance Logs */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-md flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-1">Student Attendance Audit Logs</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Export audited attendance presences across all events, volunteer roll numbers, and marking coordinator IDs.
            </p>
          </div>
          <button
            onClick={() => triggerDownload('attendance', `student_attendance_backup_${new Date().toISOString().slice(0,10)}.json`)}
            disabled={downloading === 'attendance'}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 dark:bg-slate-700 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading === 'attendance' ? 'Exporting Attendance...' : 'Export Attendance Logs (.JSON)'}
          </button>
        </div>
      </div>
    </div>
  );
}
