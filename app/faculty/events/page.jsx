'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Calendar, Plus, MapPin, Users, ClipboardCheck, QrCode,
  Camera, Filter, Image as ImageIcon, CheckCircle2, Building2
} from 'lucide-react';
import EventQRModal from '@/components/EventQRModal';

const EventDetailsModal = dynamic(() => import('@/components/EventDetailsModal'), {
  loading: () => (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl">
        <p className="text-slate-500 animate-pulse">Loading Event Manager...</p>
      </div>
    </div>
  ),
});

export default function FacultyEvents() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dbUser, setDbUser] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [initialModalTab, setInitialModalTab] = useState('details');
  const [presentEvent, setPresentEvent] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [eventFilter, setEventFilter] = useState('MY_BRANCH'); // 'MY_BRANCH' | 'ALL'
  
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    type: 'ACTIVITY'
  });

  const fetchData = useCallback(async (p = 1, filterType = eventFilter, user = dbUser) => {
    setLoading(true);
    let url = `/api/events?page=${p}&limit=18`;
    if (filterType === 'MY_BRANCH' && user?.faculty?.departmentId) {
      url += `&departmentId=${user.faculty.departmentId}`;
    }

    const res = await fetch(url);
    const data = await res.json();
    setEvents(data.events || []);
    setPage(data.pagination?.page || 1);
    setTotalPages(data.pagination?.totalPages || 1);
    setLoading(false);
  }, [eventFilter, dbUser]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setDbUser(data.user);
          fetchData(1, eventFilter, data.user);
        }
      })
      .catch(console.error);
  }, [eventFilter, fetchData]);

  const handleFilterChange = (type) => {
    setEventFilter(type);
    fetchData(1, type, dbUser);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventForm)
    });

    if (res.ok) {
      const data = await res.json();
      toast.success('Unit event created successfully! You can now upload photos & attendance.');
      setEventForm({ title: '', description: '', date: '', location: '', type: 'ACTIVITY' });
      setShowCreateForm(false);
      fetchData(1, eventFilter, dbUser);
      if (data.event) {
        setPresentEvent(data.event);
      }
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.message || 'Failed to create event');
    }
  };

  const openEventModal = (eventId, tab = 'details') => {
    setSelectedEventId(eventId);
    setInitialModalTab(tab);
  };

  const cardClass = 'bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700/80';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-7 h-7 text-logo-teal" />
            Unit Event & Photo Operations
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {dbUser?.faculty?.department?.name || 'Department Branch'} &bull; Manage campaigns, upload drive photos, and audit attendance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-2xl">
            <button
              onClick={() => handleFilterChange('MY_BRANCH')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                eventFilter === 'MY_BRANCH' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              My Unit Events
            </button>
            <button
              onClick={() => handleFilterChange('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                eventFilter === 'ALL' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              All NSS Units
            </button>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-logo-navy to-logo-teal text-white text-xs font-bold rounded-2xl hover:opacity-90 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> {showCreateForm ? 'Close Form' : 'Post Unit Event'}
          </button>
        </div>
      </div>

      {/* Creation Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateEvent} className={`${cardClass} p-6 sm:p-8 space-y-4 animate-fadeIn border-2 border-logo-teal/40`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Post New Unit Campaign / Drive</h3>
              <p className="text-xs text-slate-400">Created under {dbUser?.faculty?.department?.name || 'Your NSS Unit'}</p>
            </div>
            <button type="button" onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Event Title *</label>
              <input
                type="text"
                placeholder="e.g. Mega Blood Donation Drive & Health Camp"
                required
                value={eventForm.title}
                onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-logo-teal outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Campaign Type *</label>
              <select
                value={eventForm.type}
                onChange={e => setEventForm({ ...eventForm, type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-logo-teal outline-none font-bold"
              >
                <option value="CAMP">CAMP (Special Service / Medical / Blood)</option>
                <option value="ACTIVITY">ACTIVITY (Campus Cleanliness / Tree Plantation)</option>
                <option value="WORKSHOP">WORKSHOP (Digital Literacy / Cyber Safety)</option>
                <option value="RALLY">RALLY (Awareness Walk / Social Cause)</option>
                <option value="AWARENESS">AWARENESS (Community Outreach)</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={eventForm.date}
                onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-logo-teal outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Location / Venue *</label>
              <input
                type="text"
                placeholder="e.g. Main Auditorium / Adopted Village"
                required
                value={eventForm.location}
                onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-logo-teal outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Description & Volunteer Objectives</label>
            <textarea
              rows={3}
              placeholder="Outline event goals, requirements, guidelines for volunteers..."
              value={eventForm.description}
              onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-logo-teal outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-logo-teal to-emerald-500 text-slate-950 text-xs font-black rounded-xl hover:opacity-90 transition shadow-md"
            >
              Publish Event & Generate QR
            </button>
          </div>
        </form>
      )}

      {/* Events Grid */}
      {loading ? (
        <div className="text-slate-500 py-12 text-center animate-pulse">Loading unit events...</div>
      ) : events.length === 0 ? (
        <div className={`${cardClass} p-12 text-center text-slate-400 space-y-3`}>
          <Calendar className="w-10 h-10 mx-auto text-slate-300" />
          <p className="font-bold">No events recorded for this selection.</p>
          <p className="text-xs max-w-sm mx-auto">Create your first unit event to begin logging attendance and uploading drive photos.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(e => (
            <div
              key={e.id}
              className={`${cardClass} p-5 flex flex-col justify-between space-y-4 hover:shadow-md hover:border-logo-teal/40 transition group`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-logo-teal/10 text-logo-teal border border-logo-teal/20">
                      {e.type}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
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
                    <span>{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{e.location || 'Campus'}</span>
                  </div>
                </div>

                {/* Photo Previews Strip */}
                {Array.isArray(e.photos) && e.photos.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-logo-teal" /> {e._count?.photos || e.photos.length} Photos Uploaded
                    </p>
                    <div className="flex gap-1.5 overflow-hidden rounded-xl">
                      {e.photos.map((p, idx) => (
                        <div key={idx} className="w-12 h-12 relative rounded-lg bg-slate-900 overflow-hidden shrink-0">
                          <Image src={p.url} alt="Drive photo" fill className="object-cover" unoptimized />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Toolbar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => openEventModal(e.id, 'photos')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-logo-teal/10 text-logo-teal hover:bg-logo-teal/20 text-xs font-bold transition"
                  title="Upload / Manage Photos"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Photos ({e._count?.photos || 0})</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPresentEvent(e)}
                    className="p-2 text-slate-500 hover:text-logo-navy dark:hover:text-logo-teal hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                    title="View QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => openEventModal(e.id, 'details')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition"
                  >
                    Manage & Attendance
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedEventId && (
        <EventDetailsModal
          eventId={selectedEventId}
          initialTab={initialModalTab}
          currentUser={dbUser}
          onClose={() => setSelectedEventId(null)}
          onRefresh={() => fetchData(page, eventFilter, dbUser)}
        />
      )}

      {presentEvent && (
        <EventQRModal
          event={presentEvent}
          onClose={() => setPresentEvent(null)}
        />
      )}
    </div>
  );
}
