'use client';
import { useState, useEffect, useCallback } from 'react';
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentPortfolio() {
  const [certificates, setCertificates] = useState([]);
  const [certForm, setCertForm] = useState({ title: '', description: '', fileUrl: '' });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/certificates');
    const data = await res.json();
    setCertificates(data.certificates || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUploadCertificate = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/certificates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(certForm) });
    if (res.ok) {
      toast.success('Certificate uploaded successfully');
      setCertForm({ title: '', description: '', fileUrl: '' });
      fetchData();
    } else {
      toast.error('Failed to upload certificate');
    }
  };

  if (loading) return <div className="text-slate-500 py-8">Loading portfolio...</div>;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';
  const btnPrimary = 'px-4 py-2 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-lg hover:opacity-90 transition text-sm font-medium shadow-sm';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">My Portfolio & Certificates</h2>
      <form onSubmit={handleUploadCertificate} className={`${cardClass} p-6 space-y-4`}>
        <h3 className="font-semibold">Upload Certificate</h3>
        <input placeholder="Certificate title" required value={certForm.title} onChange={e => setCertForm({...certForm, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
        <input placeholder="Description (optional)" value={certForm.description} onChange={e => setCertForm({...certForm, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
        <input placeholder="File URL (paste link)" required value={certForm.fileUrl} onChange={e => setCertForm({...certForm, fileUrl: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
        <button type="submit" className={btnPrimary + ' flex items-center gap-2'}><Upload className="w-4 h-4" /> Upload</button>
      </form>
      <div className="grid md:grid-cols-2 gap-4">
        {certificates.map(cert => (
          <div key={cert.id} className={`${cardClass} p-5`}>
            <h4 className="font-bold">{cert.title}</h4>
            {cert.description && <p className="text-sm text-slate-500 mt-1">{cert.description}</p>}
            <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-logo-teal hover:underline mt-2 inline-block">View Certificate →</a>
            <p className="text-xs text-slate-400 mt-1">{new Date(cert.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
        {certificates.length === 0 && <p className="text-center text-slate-500 py-4 col-span-2">No certificates uploaded yet.</p>}
      </div>
    </div>
  );
}
