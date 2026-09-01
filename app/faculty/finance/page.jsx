'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, DollarSign, TrendingUp, TrendingDown, Wallet,
  FileText, Building2, Filter, Download, PieChart, BarChart2,
  Calendar, CheckCircle2, ArrowUpRight, Receipt, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function FinancePage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, totalBudget: 0, balance: 0, utilizationRate: 0 });
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [yearSummaries, setYearSummaries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branchSummaries, setBranchSummaries] = useState([]);
  
  // Filters
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2025-2026');
  const [selectedType, setSelectedType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [category, setCategory] = useState('Event Logistics');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadFinance = useCallback((deptFilter = selectedBranch, ayFilter = selectedAcademicYear, typeFilter = selectedType) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (deptFilter) params.set('departmentId', deptFilter);
    if (ayFilter) params.set('academicYear', ayFilter);
    if (typeFilter) params.set('type', typeFilter);

    fetch(`/api/finance?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.records) setRecords(data.records);
        if (data.summary) setSummary(data.summary);
        if (data.categoryBreakdown) setCategoryBreakdown(data.categoryBreakdown);
        if (data.yearSummaries) setYearSummaries(data.yearSummaries);
        if (data.departments) setDepartments(data.departments);
        if (data.branchSummaries) setBranchSummaries(data.branchSummaries);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedBranch, selectedAcademicYear, selectedType]);

  useEffect(() => {
    loadFinance(selectedBranch, selectedAcademicYear, selectedType);
  }, [loadFinance, selectedBranch, selectedAcademicYear, selectedType]);

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
        body: JSON.stringify({
          title,
          amount,
          type,
          category,
          description,
          receiptUrl,
          departmentId: departmentId || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Financial ledger record created successfully!');
      setModalOpen(false);
      setTitle(''); setAmount(''); setDescription(''); setReceiptUrl(''); setDepartmentId('');
      loadFinance(selectedBranch, selectedAcademicYear, selectedType);
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
        loadFinance(selectedBranch, selectedAcademicYear, selectedType);
      } else {
        toast.error('Failed to delete (Admin only)');
      }
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleExportAuditCSV = () => {
    const headers = ['Transaction Date', 'Academic Year', 'Title', 'Type', 'Category', 'Branch', 'Amount (INR)', 'Logged By', 'Receipt URL'];
    const rows = records.map(r => [
      `"${new Date(r.createdAt).toLocaleDateString()}"`,
      `"${r.academicYear || selectedAcademicYear}"`,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      r.type,
      `"${r.category}"`,
      `"${r.department?.code || 'NSS Unit'}"`,
      r.amount,
      `"${r.createdBy?.name || 'Authorized Lead'}"`,
      `"${r.receiptUrl || 'None'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NSS_Financial_Report_AY_${selectedAcademicYear || 'ALL'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Financial Audit Report (AY ${selectedAcademicYear}) downloaded!`);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Control Toolbar */}
      <div className="bg-gradient-to-br from-slate-900 via-logo-navy to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-logo-teal/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-logo-teal/20 text-logo-teal text-xs font-extrabold uppercase tracking-wider mb-2 border border-logo-teal/30">
              <Wallet className="w-3.5 h-3.5" /> Financial Audit & Budgeting
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Year-Wise Financial Ledger & Reports</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Track allocated budgets, sponsorships, operational expenses, digital receipts, and year-over-year financial reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => loadFinance(selectedBranch, selectedAcademicYear, selectedType)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/10"
              title="Refresh Ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExportAuditCSV}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition"
            >
              <Download className="w-4 h-4" />
              <span>Export Financial Audit (CSV)</span>
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-logo-teal to-emerald-500 text-slate-950 font-black text-xs hover:opacity-90 shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Financial Entry</span>
            </button>
          </div>
        </div>

        {/* Academic Year Selector Pills Toolbar */}
        <div className="relative z-10 mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Academic Year:</span>
            {['ALL', '2026-2027', '2025-2026', '2024-2025', '2023-2024'].map(year => (
              <button
                key={year}
                onClick={() => setSelectedAcademicYear(year)}
                className={`px-4 py-1.5 rounded-full text-xs font-black transition whitespace-nowrap ${
                  selectedAcademicYear === year
                    ? 'bg-logo-teal text-slate-950 shadow-md scale-105'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                {year === 'ALL' ? 'All Academic Years' : `AY ${year}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-logo-teal"
            >
              <option value="" className="bg-slate-900 text-white">All Academic Branches</option>
              {departments.map(d => (
                <option key={d.id} value={d.id} className="bg-slate-900 text-white">{d.name} ({d.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Allocated Budget</span>
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-500 border border-blue-100 dark:border-blue-900/40">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">₹{summary.totalBudget?.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">AY {selectedAcademicYear} Allocation</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Expenses</span>
            <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 border border-rose-100 dark:border-rose-900/40">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">₹{summary.totalExpense?.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{summary.utilizationRate}% budget utilized</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Income / Sponsorships</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 border border-emerald-100 dark:border-emerald-900/40">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">₹{summary.totalIncome?.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Donations & partner funds</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Remaining Balance</span>
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 text-purple-500 border border-purple-100 dark:border-purple-900/40">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${
              summary.balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'
            }`}>
              ₹{summary.balance?.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Available for upcoming drives</p>
          </div>
        </div>
      </div>

      {/* Year-over-Year Financial Reports & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Multi-Year Audit Summary (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-logo-teal" /> Year-Wise Financial Audit Comparison
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Budget allocation and actual expenses across academic years.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-logo-teal/10 text-logo-teal border border-logo-teal/20">
              Annual Breakdown
            </span>
          </div>

          <div className="space-y-4">
            {yearSummaries.map((ys) => {
              const isCurrent = ys.academicYear === selectedAcademicYear;
              return (
                <div
                  key={ys.academicYear}
                  onClick={() => setSelectedAcademicYear(ys.academicYear)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    isCurrent
                      ? 'bg-logo-teal/5 border-logo-teal shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700/60 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                        isCurrent ? 'bg-logo-teal text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        AY {ys.academicYear}
                      </span>
                      <span className="text-xs text-slate-500">
                        Allocated: <strong className="text-slate-900 dark:text-white">₹{ys.totalBudget.toLocaleString()}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-rose-500 font-bold">Spend: ₹{ys.totalExpense.toLocaleString()}</span>
                      <span className="text-emerald-500 font-bold">Balance: ₹{ys.balance.toLocaleString()}</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-300">{ys.utilizationRate}%</span>
                    </div>
                  </div>

                  {/* Budget Utilization Meter */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        ys.utilizationRate > 90 ? 'bg-red-500' : isCurrent ? 'bg-gradient-to-r from-logo-navy to-logo-teal' : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.min(100, ys.utilizationRate)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Category Breakdown (1 Col) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-logo-teal" /> Expense Category Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">AY {selectedAcademicYear} expenditure distribution.</p>
          </div>

          <div className="space-y-3">
            {categoryBreakdown.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No categorized expense records for this selection.</div>
            ) : (
              categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{cat.category}</span>
                    <p className="text-[10px] text-slate-400">{cat.count} recorded entries</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400">₹{cat.expense.toLocaleString()}</span>
                    {cat.income > 0 && <p className="text-[10px] text-emerald-500">+₹{cat.income.toLocaleString()}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Financial Transactions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-logo-teal" /> Financial Transactions & Receipts Ledger ({records.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Itemized income, expense, and budget allocations for AY {selectedAcademicYear}.</p>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            {['', 'EXPENSE', 'INCOME', 'BUDGET'].map(t => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  selectedType === t
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {t === '' ? 'All Types' : t}
              </button>
            ))}
          </div>
        </div>

        {records.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-sm">No financial records found for AY {selectedAcademicYear}.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-3 px-4 py-1.5 bg-logo-teal text-slate-950 rounded-xl text-xs font-bold hover:opacity-90"
            >
              Add First Transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Transaction Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{r.title}</p>
                      {r.description && <p className="text-[11px] text-slate-400 line-clamp-1">{r.description}</p>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                      {r.department?.code || 'All NSS'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        r.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' :
                        r.type === 'EXPENSE' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      }`}>
                        {r.type}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 text-right font-black ${
                      r.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' :
                      r.type === 'EXPENSE' ? 'text-rose-600 dark:text-rose-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`}>
                      {r.type === 'EXPENSE' ? '-' : '+'}₹{r.amount?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {r.receiptUrl ? (
                        <a
                          href={r.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-logo-teal hover:underline font-bold text-[11px]"
                        >
                          <Receipt className="w-3.5 h-3.5" /> View
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition"
                        title="Delete Record"
                      >
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

      {/* Modal: Add Financial Entry */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-logo-teal" /> Record Financial Entry
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Transaction Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blood Donation Camp Refreshments & First Aid"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-logo-teal outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Amount (INR ₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 4500"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-logo-teal outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Transaction Type *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-logo-teal outline-none font-bold"
                  >
                    <option value="EXPENSE">EXPENSE (Outflow)</option>
                    <option value="INCOME">INCOME (Sponsorship/Grant)</option>
                    <option value="BUDGET">BUDGET (Annual Allocation)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-logo-teal outline-none"
                  >
                    <option value="Event Logistics">Event Logistics</option>
                    <option value="Refreshments">Refreshments & Food</option>
                    <option value="Medical & First Aid">Medical & First Aid</option>
                    <option value="Transportation">Transportation & Fuel</option>
                    <option value="Printing & Banners">Printing & Banners</option>
                    <option value="Awards & Certificates">Awards & Certificates</option>
                    <option value="Sponsorship & Donation">Sponsorship & Donation</option>
                    <option value="General Operational">General Operational</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Department / Branch</label>
                  <select
                    value={departmentId}
                    onChange={e => setDepartmentId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-logo-teal outline-none"
                  >
                    <option value="">Central NSS Unit</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Receipt / Invoice Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://... or cloud storage receipt URL"
                  value={receiptUrl}
                  onChange={e => setReceiptUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-logo-teal outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Notes / Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional context, invoice voucher numbers, or vendor details..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-logo-teal outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-logo-teal to-emerald-500 hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
