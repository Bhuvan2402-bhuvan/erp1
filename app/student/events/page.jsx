'use client';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  Camera, Calendar, QrCode, MapPin, Users,
  Building2, CheckCircle2, Image as ImageIcon, Sparkles
} from 'lucide-react';
import VolunteerQRScannerModal from '@/components/VolunteerQRScannerModal';

const EventDetailsModal = dynamic(() => import('@/components/EventDetailsModal'), {
  loading: () => (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl">
        <p className="text-slate-500 animate-pulse">Loading Event Details...</p>
      </div>
    </div>
  ),
});

export default function StudentEvents() {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dbUser, setDbUser] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [initialModalTab, setInitialModalTab] = useState('details');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [filterUnit, setFilterUnit] = useState('ALL'); // 'ALL' | 'MY_UNIT'

  const fetchData = useCallback(async (p = 1, unitFilter = filterUnit, userDeptId) => {
    setLoading(true);
    let url = `/api/events?page=${p}&limit=18`;
    const deptId = userDeptId !== undefined ? userDeptId : dbUser?.student?.departmentId;
    if (unitFilter === 'MY_UNIT' && deptId) {
      url += `&departmentId=${deptId}`;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();
      setEvents(data.events || []);
      setPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterUnit, dbUser?.student?.departmentId]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setDbUser(data.user);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchData(1, filterUnit);
  }, [filterUnit, dbUser?.student?.departmentId, fetchData]);

  const handleUnitFilter = (unit) => {
    setFilterUnit(unit);
  };

  const handleRegister = async (eventId, e) => {
    if (e) e.stopPropagation();
    const res = await fetch(`/api/events/${eventId}/register`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.message || 'Registered successfully for event!');
      fetchData(page, filterUnit, dbUser);
    } else {
      toast.error(data.message || 'Registration failed');
    }
  };

  const handleCancelRegistration = async (eventId, e) => {
    if (e) e.stopPropagation();
    const res = await fetch(`/api/events/${eventId}/register`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      toast.success('Registration cancelled');
      fetchData(page, filterUnit, dbUser);
    } else {
      toast.error('Failed to cancel registration');
    }
  };

  const openEvent = (eventId, tab = 'details') => {
    setSelectedEventId(eventId);
    setInitialModalTab(tab);
  };

  const cardClass = 'bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700/80';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-logo-teal" /> NSS Unit Events & Volunteer Drives
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse unit campaigns, view activity photos uploaded by faculty coordinators, and scan QR codes for attendance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Unit Filter */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-2xl">
            <button
              onClick={() => handleUnitFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                filterUnit === 'ALL' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              All Units
            </button>
            <button
              onClick={() => handleUnitFilter('MY_UNIT')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                filterUnit === 'MY_UNIT' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              My Unit ({dbUser?.student?.department?.code || 'Branch'})
            </button>
          </div>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-logo-navy to-logo-teal text-white text-xs font-bold rounded-2xl hover:opacity-90 transition shadow-md"
          >
            <Camera className="w-4 h-4" /> Scan Event Attendance QR
          </button>
        </div>
      </div>

      <VolunteerQRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAttendanceMarked={() => fetchData(page, filterUnit, dbUser)}
      />

      {/* Events Grid */}
      {loading ? (
        <div className="text-slate-500 py-12 text-center animate-pulse">Loading volunteer events...</div>
      ) : events.length === 0 ? (
        <div className={`${cardClass} p-12 text-center text-slate-400 space-y-3`}>
          <Calendar className="w-10 h-10 mx-auto text-slate-300" />
          <p className="font-bold">No events available in this view.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(e => (
            <div
              key={e.id}
              className={`${cardClass} p-5 flex flex-col justify-between space-y-4 hover:shadow-md hover:border-logo-teal/40 transition group cursor-pointer`}
              onClick={() => openEvent(e.id, 'details')}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-logo-teal/10 text-logo-teal border border-logo-teal/20">
                      {e.type}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {e.createdBy?.department?.code || 'Central'} Unit
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    e.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' :
                    e.status === 'ONGOING' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {e.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1 group-hover:text-logo-teal transition-colors">
                    {e.title}
                  </h4>
                  {e.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {e.description}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-logo-teal" />
                    <span>{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{e.location || 'Campus'}</span>
                  </div>
                </div>

                {/* Photo Previews from Unit Coordinator */}
                {Array.isArray(e.photos) && e.photos.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60" onClick={ev => ev.stopPropagation()}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <Camera className="w-3 h-3 text-logo-teal" /> {e._count?.photos || e.photos.length} Drive Photos
                      </p>
                      <button
                        onClick={() => openEvent(e.id, 'photos')}
                        className="text-[10px] font-bold text-logo-teal hover:underline"
                      >
                        View Gallery &rarr;
                      </button>
                    </div>
                    <div className="flex gap-1.5 overflow-hidden rounded-xl">
                      {e.photos.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => openEvent(e.id, 'photos')}
                          className="w-12 h-12 relative rounded-lg bg-slate-900 overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition"
                        >
                          <Image src={p.url} alt="Event photo" fill className="object-cover" unoptimized />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Toolbar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2" onClick={ev => ev.stopPropagation()}>
                <button
                  onClick={() => openEvent(e.id, 'photos')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-logo-teal text-xs font-bold transition"
                >
                  <Camera className="w-3.5 h-3.5 text-logo-teal" />
                  <span>Photos ({e._count?.photos || 0})</span>
                </button>

                {e.isRegistered ? (
                  <button
                    onClick={(ev) => handleCancelRegistration(e.id, ev)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition"
                  >
                    Cancel Registration
                  </button>
                ) : (
                  <button
                    onClick={(ev) => handleRegister(e.id, ev)}
                    disabled={e.status === 'COMPLETED'}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-logo-navy to-logo-teal text-white text-xs font-bold hover:opacity-90 transition disabled:opacity-40"
                  >
                    {e.status === 'COMPLETED' ? 'Event Ended' : 'Register Now'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedEventId && (
        <EventDetailsModal
          eventId={selectedEventId}
          initialTab={initialModalTab}
          currentUser={dbUser}
          onClose={() => setSelectedEventId(null)}
          onRefresh={() => fetchData(page, filterUnit, dbUser)}
        />
      )}
    </div>
  );
}
