'use client';
import { useState, useEffect, useCallback } from 'react';
import { BookOpen, FileText, Download, Plus, Trash2, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DocumentationPage({ canUpload = false }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [docCategory, setDocCategory] = useState('REPORT');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDocs = useCallback(() => {
    setLoading(true);
    const query = category ? `?category=${category}` : '';
    fetch(`/api/documentation${query}`)
      .then(res => res.json())
      .then(data => {
        if (data.docs) setDocs(data.docs);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !fileUrl) {
      toast.error('Title and file URL are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/documentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category: docCategory, description, fileUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Document uploaded!');
      setModalOpen(false);
      setTitle(''); setDescription(''); setFileUrl('');
      fetchDocs();
    } catch (err) {
      toast.error(err.message || 'Failed to upload');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`/api/documentation?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Document deleted');
        fetchDocs();
      }
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Documentation & Reports Hub</h1>
          <p className="text-xs text-slate-400 mt-1">Access event reports, circular guidelines, and archived documentation.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        {[
          { label: 'All Documents', value: '' },
          { label: 'Event Reports', value: 'REPORT' },
          { label: 'Circulars & Notices', value: 'CIRCULAR' },
          { label: 'Guidelines', value: 'GUIDELINE' },
          { label: 'Archives', value: 'ARCHIVE' }
        ].map(item => (
          <button
            key={item.value}
            onClick={() => setCategory(item.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              category === item.value
                ? 'bg-logo-teal text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Grid of Documents */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading document library...</div>
      ) : docs.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
          No documents found for this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map(doc => (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-md flex flex-col justify-between hover:shadow-lg transition"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2.5 py-1 rounded-full bg-logo-teal/10 text-logo-teal text-[10px] font-extrabold uppercase">
                    {doc.category}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2 leading-snug">
                  {doc.title}
                </h3>
                {doc.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-3 leading-relaxed">
                    {doc.description}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 font-medium">
                  Uploaded by: {doc.uploadedBy?.name || 'User'} ({doc.uploadedBy?.role})
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex justify-between items-center">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-logo-teal hover:text-white rounded-xl text-xs font-bold transition"
                >
                  <Download className="w-3.5 h-3.5" /> Download / View
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-4">Upload Documentation / Report</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Blood Drive Summary Report 2026"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-logo-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                <select
                  value={docCategory}
                  onChange={e => setDocCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-logo-teal"
                >
                  <option value="REPORT">Event Report</option>
                  <option value="CIRCULAR">Circular Notice</option>
                  <option value="GUIDELINE">Standard Operating Guideline</option>
                  <option value="ARCHIVE">Historical Archive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Description (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="Brief abstract or notes on the document..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-logo-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">File URL / Drive Link</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={fileUrl}
                  onChange={e => setFileUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-logo-teal"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-logo-navy to-logo-teal text-white text-xs font-bold rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitting ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
