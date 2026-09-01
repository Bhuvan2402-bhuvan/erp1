'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Grid, Calendar, Award, ArrowLeft, Camera, Search, Filter,
  MapPin, Eye, X, Star, Heart, MessageCircle, Bookmark, Share2, Shield, UserCheck, Sparkles, Building2, Users
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { DEFAULT_FACULTY_PROFILES } from '@/lib/faculty-defaults';

function VisitorContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'feed';

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab); // 'feed' | 'events' | 'faculty' | 'directory'
  
  const [stats, setStats] = useState({ totalVolunteers: 500, totalCoordinators: 20, totalFaculty: 15, totalEvents: 85 });
  const [departments, setDepartments] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [events, setEvents] = useState([]);
  const [facultyDesk, setFacultyDesk] = useState(DEFAULT_FACULTY_PROFILES);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  
  // Lightbox Modal
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/visitor')
      .then(res => res.json())
      .then(data => {
        if (data.stats) setStats(data.stats);
        if (data.departments) setDepartments(data.departments);
        if (data.photos) setPhotos(data.photos);
        if (data.events) setEvents(data.events);
        if (data.facultyDesk && data.facultyDesk.length > 0) {
          setFacultyDesk(data.facultyDesk);
        }
      })
      .catch(err => console.error('Failed to load visitor data:', err))
      .finally(() => setLoading(false));
  }, []);

  // Filtered Photo Feed
  const filteredPhotos = photos.filter(p => {
    const matchesSearch = (p.caption || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.eventTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.eventLocation || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !selectedDept || p.departmentCode === selectedDept || p.departmentName === selectedDept;
    return matchesSearch && matchesDept;
  });

  // Filtered Events
  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !selectedDept || e.departmentCode === selectedDept || e.departmentName === selectedDept;
    return matchesSearch && matchesDept;
  });

  // Filtered Faculty
  const filteredFaculty = facultyDesk.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (f.designation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (f.branch || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (f.foreword || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !selectedDept || (f.branch || '').toUpperCase().includes(selectedDept.toUpperCase());
    return matchesSearch && matchesDept;
  });

  const pcProfile = filteredFaculty.find(f => f.role === 'NSS_PC') || facultyDesk.find(f => f.role === 'NSS_PC');
  const poProfiles = filteredFaculty.filter(f => f.role !== 'NSS_PC');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none z-0" />

      {/* Visitor Header */}
      <header className="border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Image src="/vvit-logo.jpg" alt="VVIT Logo" width={70} height={35} className="h-8 w-auto object-contain rounded" priority unoptimized />
              <div className="h-5 w-px bg-slate-300 dark:bg-slate-700" />
              <Image src="/nss-logo.png" alt="NSS Logo" width={90} height={35} className="h-8 w-auto object-contain" priority unoptimized />
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 relative z-10 w-full space-y-8">
        
        {/* Instagram Profile Style Header Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-md">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-10">
            {/* NSS Emblem Avatar */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-logo-teal to-logo-navy shadow-lg">
                <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 p-2 flex items-center justify-center">
                  <Image src="/nss-logo.png" alt="NSS Unit" width={100} height={100} className="w-full h-full object-contain" priority unoptimized />
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">vvit_nss_official</h1>
                  <span className="w-5 h-5 rounded-full bg-logo-teal text-white flex items-center justify-center text-[10px] font-bold" title="Verified ERP Unit">✓</span>
                </div>
                <Link
                  href="/login"
                  className="px-5 py-2 text-xs font-extrabold rounded-xl bg-gradient-to-r from-logo-navy to-logo-teal text-white hover:opacity-90 transition shadow-sm"
                >
                  Volunteer Login
                </Link>
              </div>

              {/* Stats Bar */}
              <div className="flex justify-center md:justify-start gap-8 py-2 border-y border-slate-100 dark:border-slate-700/60 text-sm">
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white">{photos.length}</span>{' '}
                  <span className="text-slate-500 text-xs">posts</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white">{stats.totalEvents}</span>{' '}
                  <span className="text-slate-500 text-xs">campaigns</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white">{stats.totalVolunteers}</span>{' '}
                  <span className="text-slate-500 text-xs">volunteers</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white">{stats.totalFaculty}</span>{' '}
                  <span className="text-slate-500 text-xs">faculty officers</span>
                </div>
              </div>

              {/* Bio / Description */}
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">VVIT NSS ERP Unit &bull; &ldquo;Not Me, But You&rdquo;</p>
                <p className="text-slate-500">Official gallery & activity showcase of VVIT National Service Scheme campaigns, blood drives, rallies, and social service initiatives across all academic branches.</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Instagram style) */}
          <div className="flex justify-center border-t border-slate-200 dark:border-slate-700 mt-8 pt-2">
            <div className="flex gap-8 sm:gap-16 text-xs sm:text-sm font-bold uppercase tracking-wider">
              <button
                onClick={() => setActiveTab('feed')}
                className={`flex items-center gap-2 py-3 border-b-2 transition ${
                  activeTab === 'feed'
                    ? 'border-logo-teal text-logo-teal'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <Grid className="w-4 h-4" /> Posts Feed
              </button>

              <button
                onClick={() => setActiveTab('events')}
                className={`flex items-center gap-2 py-3 border-b-2 transition ${
                  activeTab === 'events'
                    ? 'border-logo-teal text-logo-teal'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <Calendar className="w-4 h-4" /> Drives & Camps ({events.length})
              </button>

              <button
                onClick={() => setActiveTab('faculty')}
                className={`flex items-center gap-2 py-3 border-b-2 transition ${
                  activeTab === 'faculty'
                    ? 'border-logo-teal text-logo-teal'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <Award className="w-4 h-4" /> NSS Desk ({facultyDesk.length})
              </button>
            </div>
          </div>
        </div>

        {/* Filter bar for Feed, Events & Faculty Directory */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'feed'
                  ? "Search activity photos or locations..."
                  : activeTab === 'events'
                  ? "Search event titles or descriptions..."
                  : "Search faculty name, branch, or designation..."
              }
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-logo-teal"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full md:w-56 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-logo-teal"
            >
              <option value="">All Academic Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.code}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── TAB 1: INSTAGRAM PHOTO FEED GRID ── */}
        {activeTab === 'feed' && (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
                    <div className="p-3.5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                      </div>
                    </div>
                    <div className="aspect-square bg-slate-200 dark:bg-slate-700" />
                  </div>
                ))}
              </div>
            ) : filteredPhotos.length === 0 ? (
              <div className="p-16 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <Camera className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="font-bold text-slate-700 dark:text-slate-200 text-base">No activity photos found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">Check out our ongoing campaigns in the &quot;Drives &amp; Camps&quot; tab or meet our faculty officers in the &quot;NSS Desk&quot; tab.</p>
                <div className="mt-5 flex justify-center gap-3">
                  <button onClick={() => setActiveTab('faculty')} className="px-4 py-2 text-xs font-bold bg-logo-teal/10 text-logo-teal rounded-full hover:bg-logo-teal/20 transition">
                    View Faculty Directory
                  </button>
                  <button onClick={() => setActiveTab('events')} className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full hover:opacity-80 transition">
                    View Camps & Drives
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPhotos.map(photo => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col"
                  >
                    {/* Header bar of post */}
                    <div className="p-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-logo-navy to-logo-teal text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {photo.departmentCode ? photo.departmentCode[0] : 'N'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{photo.eventTitle || 'NSS Campaign'}</p>
                          <p className="text-[10px] text-slate-400 truncate">{photo.departmentName}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-logo-teal/10 text-logo-teal text-[10px] font-extrabold uppercase shrink-0">
                        {photo.departmentCode || 'NSS'}
                      </span>
                    </div>

                    {/* Image Container (Aspect Square) */}
                    <div className="relative aspect-square bg-slate-900 overflow-hidden">
                      <Image
                        src={photo.url}
                        alt={photo.caption || photo.eventTitle}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-sm">
                        <span className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-xs">
                          <Eye className="w-4 h-4 text-logo-teal" /> View Details
                        </span>
                      </div>
                    </div>

                    {/* Footer / Caption */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between text-slate-400">
                        <div className="flex items-center gap-3">
                          <Heart className="w-4 h-4 hover:text-rose-500 transition" />
                          <MessageCircle className="w-4 h-4 hover:text-logo-teal transition" />
                          <Share2 className="w-4 h-4 hover:text-logo-teal transition" />
                        </div>
                        <Bookmark className="w-4 h-4 hover:text-amber-500 transition" />
                      </div>

                      <div>
                        {photo.caption && (
                          <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            <span className="font-bold mr-1 text-slate-900 dark:text-white">{photo.eventTitle}:</span>
                            {photo.caption}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">
                          Posted by {photo.uploadedBy || 'NSS Coordinator'} &bull; {new Date(photo.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: CAMPAIGN EVENTS CARD GRID ── */}
        {activeTab === 'events' && (
          <div>
            {loading ? (
              <div className="p-16 text-center text-slate-400 text-sm">Loading campaigns...</div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-16 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
                <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="font-bold text-slate-600 dark:text-slate-300">No campaigns found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map(evt => {
                  const evtDate = new Date(evt.date);
                  const month = evtDate.toLocaleString('default', { month: 'short' });
                  const day = evtDate.getDate();
                  const year = evtDate.getFullYear();

                  return (
                    <div key={evt.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-sm hover:shadow-lg transition flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="bg-logo-teal/10 dark:bg-logo-teal/20 border border-logo-teal/20 rounded-2xl px-3 py-2 text-center shrink-0">
                            <p className="text-[10px] font-black text-logo-teal uppercase leading-none">{month}</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{day}</p>
                            <p className="text-[9px] text-slate-400">{year}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {evt.type}
                            </span>
                            <span className="text-[10px] font-bold text-logo-teal">
                              {evt.departmentCode}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">{evt.title}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{evt.description || 'No description provided.'}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {evt.location || 'Campus'}
                        </span>
                        <span className="font-bold text-logo-navy dark:text-logo-teal">
                          {evt.registrationsCount} Registered
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: NSS FACULTY DESK (PO's & PC) ── */}
        {activeTab === 'faculty' && (
          <div className="space-y-8">

            {/* Main NSS Program Coordinator (PC) Desk */}
            {pcProfile && (
              <div className="bg-gradient-to-br from-logo-navy via-slate-900 to-logo-teal text-white rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                  {/* Photo */}
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-white/10 border-2 border-white/20 overflow-hidden shrink-0 shadow-lg flex items-center justify-center text-3xl font-black">
                    {pcProfile.photoUrl ? (
                      <Image src={pcProfile.photoUrl} alt={pcProfile.name} width={160} height={160} className="w-full h-full object-cover" unoptimized />
                    ) : (
                      pcProfile.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                    )}
                  </div>

                  {/* Details & Foreword */}
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-extrabold uppercase mb-2">
                        <Star className="w-3.5 h-3.5 fill-current text-amber-400" /> Program Coordinator (PC) Desk
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white">{pcProfile.name}</h2>
                      <p className="text-sm text-slate-300 font-medium">{pcProfile.designation} &bull; {pcProfile.branch}</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                      <p className="text-xs uppercase font-extrabold text-amber-300 tracking-wider mb-2">Foreword & Message</p>
                      <p className="text-sm italic text-slate-200 leading-relaxed">&ldquo;{pcProfile.foreword}&rdquo;</p>
                    </div>

                    {Array.isArray(pcProfile.achievements) && pcProfile.achievements.length > 0 && (
                      <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                        {pcProfile.achievements.map((ach, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-white border border-white/20">
                            <Award className="w-3.5 h-3.5 text-amber-400" /> {ach}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* NSS Program Officers (POs) Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-logo-teal" /> NSS Program Officers (PO&apos;s) Desk
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Faculty Program Officers guiding NSS units across academic branches.</p>
                </div>
              </div>

              {poProfiles.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
                  <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold">No Program Officer profiles published yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {poProfiles.map(po => (
                    <div key={po.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-logo-navy to-logo-teal text-white flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden shadow-sm">
                          {po.photoUrl ? (
                            <Image src={po.photoUrl} alt={po.name} width={64} height={64} className="w-full h-full object-cover" unoptimized />
                          ) : (
                            po.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                          )}
                        </div>
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-logo-teal/10 text-logo-teal border border-logo-teal/20">
                            NSS PO
                          </span>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base mt-1">{po.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{po.designation}</p>
                          <p className="text-xs font-bold text-logo-navy dark:text-logo-teal mt-0.5">{po.branch}</p>
                        </div>
                      </div>

                      {/* Foreword quote */}
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">&ldquo;{po.foreword}&rdquo;</p>
                      </div>

                      {/* Achievements */}
                      {Array.isArray(po.achievements) && po.achievements.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {po.achievements.map((ach, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 rounded-lg text-[11px]">
                              <Award className="w-3 h-3 text-amber-500" /> {ach}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── ACADEMIC DEPARTMENTS & VOLUNTEER DIRECTORY ── */}
            <div className="pt-8 border-t border-slate-200/60 dark:border-slate-800/60 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-logo-teal" /> Academic Departments & Volunteer Directory
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Overview of NSS volunteer enrollment and coordinators across academic disciplines.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {departments.map(dept => (
                  <div
                    key={dept.id}
                    onClick={() => {
                      setSelectedDept(selectedDept === dept.code ? '' : dept.code);
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                      selectedDept === dept.code
                        ? 'bg-logo-teal/10 border-logo-teal text-logo-teal shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 hover:border-logo-teal/40'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{dept.code}</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{dept.name}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Volunteers</span>
                      <span className="font-bold text-logo-navy dark:text-logo-teal">{dept.count || Math.floor(stats.totalVolunteers / (departments.length || 10))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Lightbox Modal for Photo Posts */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row shadow-2xl border border-slate-700" onClick={e => e.stopPropagation()}>
            {/* Left: Image */}
            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
              <Image src={selectedPhoto.url} alt={selectedPhoto.caption || selectedPhoto.eventTitle} width={800} height={600} className="max-h-[70vh] md:max-h-[85vh] w-auto object-contain" unoptimized />
            </div>

            {/* Right: Info & Comments */}
            <div className="w-full md:w-80 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-logo-navy to-logo-teal text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {selectedPhoto.departmentCode ? selectedPhoto.departmentCode[0] : 'N'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{selectedPhoto.eventTitle}</p>
                      <p className="text-[10px] text-slate-400 truncate">{selectedPhoto.departmentName}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedPhoto(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{selectedPhoto.caption || 'No caption provided.'}</p>
                </div>

                <div className="space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-logo-teal" />
                    <span>{new Date(selectedPhoto.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  {selectedPhoto.eventLocation && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedPhoto.eventLocation}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Posted by {selectedPhoto.uploadedBy || 'NSS Unit'}</span>
                <span className="px-2 py-0.5 rounded bg-logo-teal/10 text-logo-teal font-extrabold text-[10px]">{selectedPhoto.departmentCode || 'NSS'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200/60 dark:border-slate-800/60 py-6 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Bhuvana Mohan Chowdary. All Rights Reserved.
      </footer>
    </div>
  );
}

export default function VisitorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-500">Loading Visitor Portal...</div>}>
      <VisitorContent />
    </Suspense>
  );
}

