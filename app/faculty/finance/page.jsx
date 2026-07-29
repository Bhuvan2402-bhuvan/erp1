'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, Wallet, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function FinancePage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, totalBudget: 0, balance: 0 });
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [category, setCategory] = useState('Event');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadFinance = () => {
    setLoading(true);
    fetch('/api/finance')
      .then(res => res.json())
      .then(data => {
        if (data.records) setRecords(data.records);
        if (data.summary) setSummary(data.summary);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFinance();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !amount || !type || !category) {
      toast.error('Please fill in title, amount, type, and category');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, amount, type, category, description, receiptUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Finance record added!');
      setModalOpen(false);
      setTitle(''); setAmount(''); setDescription(''); setReceiptUrl('');
      loadFinance();
    } catch (err) {
      toast.error(err.message || 'Failed to add finance record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this financial record?')) return;
    try {
      const res = await fetch(`/api/finance?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Record deleted');
        loadFinance();
      } else {
        toast.error('Failed to delete');
      }
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Financial Ledger & Budget Management</h1>
          <p className="text-xs text-slate-400 mt-1">Track event budgets, sponsorship income, and operational expenses.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Add Financial Entry
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase text-slate-400">Total Allocated Budget</span>
            <Wallet className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100">₹{summary.totalBudget.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase text-slate-400">Total Income / Sponsorship</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">+₹{summary.totalIncome.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase text-slate-400">Total Expenses</span>
            <TrendingDown className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">-₹{summary.totalExpense.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase text-slate-400">Remaining Balance</span>
            <DollarSign className="w-5 h-5 text-logo-teal" />
          </div>
          <p className={`text-2xl font-black ${summary.balance >= 0 ? 'text-logo-teal' : 'text-rose-500'}`}>
            ₹{summary.balance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-md overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <h3 className="text-lg font-bold">Financial Records History</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading financial ledger...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No financial records logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                  <th className="py-4 px-6">Entry Title</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Created By</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {records.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                    <td className="py-4 px-6">
                      <p className="font-bold">{rec.title}</p>
                      {rec.description && <p className="text-xs text-slate-400">{rec.description}</p>}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs font-bold">
                        {rec.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        rec.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                        rec.type === 'EXPENSE' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                      }`}>
                        {rec.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-base">
                      {rec.type === 'EXPENSE' ? `-₹${rec.amount.toLocaleString()}` : `+₹${rec.amount.toLocaleString()}`}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {rec.createdBy?.name || 'User'}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {rec.receiptUrl && (
                        <a href={rec.receiptUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-logo-teal inline-block">
                          <FileText className="w-4 h-4" />
                        </a>
                      )}
                      <button onClick={() => handleDelete(rec.id)} className="p-2 text-slate-400 hover:text-rose-500 inline-block">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-4">Add Financial Entry</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Refreshments for Blood Camp"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-logo-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="2500"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-logo-teal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-logo-teal"
                  >
                    <option value="EXPENSE">EXPENSE</option>
                    <option value="INCOME">INCOME / SPONSORSHIP</option>
                    <option value="BUDGET">BUDGET ALLOCATION</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                <input
                  type="text"
                  required
                  placeholder="Event, Equipment, Refreshments, Travel, Misc"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-logo-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Description (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Additional details..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-logo-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Receipt File URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={receiptUrl}
                  onChange={e => setReceiptUrl(e.target.value)}
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
                  {submitting ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
