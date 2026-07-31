'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Award, ShieldCheck, Search, Filter, ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function VisitorPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalVolunteers: 0, totalCoordinators: 0, totalFaculty: 0, totalEvents: 0 });
  const [departments, setDepartments] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  useEffect(() => {
    fetch('/api/visitor')
      .then(res => res.json())
      .then(data => {
        if (data.stats) setStats(data.stats);
        if (data.departments) setDepartments(data.departments);
        if (data.volunteers) setVolunteers(data.volunteers);
      })
      .catch(err => console.error('Failed to load visitor data:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredVolunteers = volunteers.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.rollNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !selectedDept || v.departmentCode === selectedDept || v.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const getTierBadge = (points = 0) => {
    if (points >= 300) return { label: 'Platinum', bg: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30' };
    if (points >= 150) return { label: 'Gold', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/30' };
    if (points >= 50) return { label: 'Silver', bg: 'bg-slate-400/10 text-slate-400 border-slate-400/30' };
    return { label: 'Bronze', bg: 'bg-amber-700/10 text-amber-700 border-amber-700/30' };
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none z-0" />

      {/* Visitor Header */}
      <header className="border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Image src="/vvit-logo.jpg" alt="VVIT Logo" width={70} height={35} className="h-8 w-auto object-contain rounded" priority />
              <div className="h-5 w-px bg-slate-300 dark:bg-slate-700" />
              <Image src="/nss-logo.png" alt="NSS Logo" width={90} height={35} className="h-8 w-auto object-contain" priority />
              <span className="font-extrabold text-sm text-slate-800 dark:text-white hidden sm:inline-block">
                VVITU NSS ERP
              </span>
            </div>
            <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-full bg-logo-teal/10 text-logo-teal border border-logo-teal/20">
              Visitor Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-logo-navy to-logo-teal rounded-full shadow hover:opacity-90 transition">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 relative z-10 w-full">
        {/* Banner */}
        <div className="bg-gradient-to-r from-logo-navy via-slate-900 to-logo-teal text-white p-8 rounded-3xl shadow-xl mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -z-0" />
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Verified Volunteer Registry</h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Public directory verifying active student volunteers, department allocations, and accrued social impact service points.
            </p>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-logo-teal/10 text-logo-teal flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black">{stats.totalVolunteers}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Volunteers</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-logo-navy/10 dark:bg-logo-navy/30 text-logo-navy dark:text-logo-teal flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black">{stats.totalCoordinators}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student Coordinators</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-logo-green/10 text-logo-green flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black">{stats.totalFaculty}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Faculty Officers</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black">{stats.totalEvents}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Drives & Camps</p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by volunteer name or roll number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-logo-teal"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full md:w-56 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-logo-teal"
            >
              <option value="">All Academic Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.code}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Volunteer Table */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-md overflow-hidden">
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
            <h3 className="text-lg font-bold">Volunteer Roster ({filteredVolunteers.length})</h3>
            <span className="text-xs text-slate-400 font-medium">Public Verified Directory</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading directory...</div>
          ) : filteredVolunteers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No matching volunteers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                    <th className="py-4 px-6">Volunteer Name</th>
                    <th className="py-4 px-6">Department</th>
                    <th className="py-4 px-6">Roll No</th>
                    <th className="py-4 px-6">Year / Sec</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6 text-right">Points / Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredVolunteers.map(v => {
                    const tier = getTierBadge(v.points);
                    return (
                      <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                        <td className="py-4 px-6 font-bold flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-logo-navy to-logo-teal text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            {v.name ? v.name[0].toUpperCase() : 'V'}
                          </div>
                          <span>{v.name}</span>
                        </td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-xs font-bold">
                            {v.departmentCode || v.department}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-mono text-xs">{v.rollNo}</td>
                        <td className="py-4 px-6 text-slate-500 text-xs">Year {v.year} • Sec {v.section}</td>
                        <td className="py-4 px-6">
                          {v.isCoordinator ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                              Coordinator
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              Volunteer
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            <span className="font-extrabold text-logo-teal text-sm">{v.points} pts</span>
                            <span className={`px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase ${tier.bg}`}>
                              {tier.label}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 dark:border-slate-800/60 py-6 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Bhuvana Mohan Chowdary. All Rights Reserved.
      </footer>
    </div>
  );
}
