'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Calendar, Plus, MapPin, Users, ClipboardCheck, QrCode } from 'lucide-react';
import EventQRModal from '@/components/EventQRModal';

const EventDetailsModal = dynamic(() => import('@/components/EventDetailsModal'), {
  loading: () => <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center"><div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl"><p className="text-slate-500 animate-pulse">Loading...</p></div></div>,
});

export default function FacultyEvents() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dbUser, setDbUser] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [presentEvent, setPresentEvent] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', location: '', type: 'ACTIVITY' });

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true);
    const res = await fetch(`/api/events?page=${p}&limit=12`);
    const data = await res.json();
    setEvents(data.events || []);
    setPage(data.pagination?.page || 1);
    setTotalPages(data.pagination?.totalPages || 1);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) setDbUser(data.user);
      })
      .catch(console.error);
    fetchData(1);
  }, [fetchData]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventForm)
    });

    if (res.ok) {
      const data = await res.json();
      toast.success('Event posted with generated QR Code!');
      setEventForm({ title: '', description: '', date: '', location: '', type: 'ACTIVITY' });
      setShowCreateForm(false);
      fetchData(1);
      if (data.event) {
        setPresentEvent(data.event);
      }
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.message || 'Failed to create event');
    }
  };

  if (loading && events.length === 0) return <div className="text-slate-500 py-8 text-center animate-pulse">Loading events...</div>;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-7 h-7 text-logo-teal" />
            NSS Events & Activity Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Post new events and manage student volunteer attendance.
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-logo-navy to-logo-teal text-white text-sm font-bold rounded-2xl hover:opacity-90 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> {showCreateForm ? 'Close Form' : 'Post New Event'}
        </button>
      </div>

      {/* Creation Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateEvent} className={`${cardClass} p-6 space-y-4 animate-fadeIn border-2 border-logo-teal/40`}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Post New Department Event</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              placeholder="Event Title"
              required
              value={eventForm.title}
              onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
              className="px-4 py-2.5 border rounded-xl text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-logo-teal"
            />
            <select
              value={eventForm.type}
              onChange={e => setEventForm({ ...eventForm, type: e.target.value })}
              className="px-4 py-2.5 border rounded-xl text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-logo-teal"
            >
              <option value="ACTIVITY">Activity</option>
              <option value="CAMP">Camp</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="RALLY">Rally</option>
              <option value="AWARENESS">Awareness</option>
            </select>
            <input
              type="datetime-local"
              required
              value={eventForm.date}
              onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
              className="px-4 py-2.5 border rounded-xl text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-logo-teal"
            />
            <input
              placeholder="Location (e.g. Main Campus Auditorium)"
              value={eventForm.location}
              onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
              className="px-4 py-2.5 border rounded-xl text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-logo-teal"
            />
          </div>
          <textarea
            placeholder="Event Description & Objectives..."
            value={eventForm.description}
            onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
            className="w-full px-4 py-2.5 border rounded-xl text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-logo-teal"
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-logo-navy to-logo-teal text-white text-xs font-bold rounded-xl hover:opacity-90 transition shadow-sm inline-flex items-center gap-2"
            >
              <ClipboardCheck className="w-4 h-4" /> Post Event & Generate QR &rarr;
            </button>
          </div>
        </form>
      )}

      {/* Events List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(e => (
          <div
            key={e.id}
            className={`${cardClass} p-5 cursor-pointer hover:shadow-md hover:border-logo-teal/40 transition-all flex flex-col justify-between`}
            onClick={() => setSelectedEventId(e.id)}
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-900 dark:text-white">{e.title}</h4>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${e.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' : e.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                  {e.status}
                </span>
              </div>
              {e.description && <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{e.description}</p>}
              <p className="text-xs text-logo-teal font-semibold">{e.type} • {new Date(e.date).toLocaleDateString()}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" /> {e.location || 'Campus'}</p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700/50 flex flex-col gap-2 text-xs text-slate-500">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {e._count?.registrations || 0} Registered</span>
                <button
                  onClick={(eStop) => {
                    eStop.stopPropagation();
                    router.push(`/faculty/attendance?eventId=${e.id}&openScanner=true`);
                  }}
                  className="px-2.5 py-1 bg-logo-teal/10 hover:bg-logo-teal/20 text-logo-teal font-bold rounded-lg transition inline-flex items-center gap-1 text-xs"
                >
                  <ClipboardCheck className="w-3 h-3" /> Attendance
                </button>
              </div>

              <button
                onClick={(eStop) => {
                  eStop.stopPropagation();
                  setPresentEvent(e);
                }}
                className="w-full py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-logo-teal hover:text-white text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5 text-logo-teal group-hover:text-white" /> Present Event QR Code
              </button>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-slate-500 col-span-3 text-center py-12">No events created yet.</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button onClick={() => fetchData(page - 1)} disabled={page <= 1} className="px-4 py-2 border rounded-xl text-sm disabled:opacity-50 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Previous</button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button onClick={() => fetchData(page + 1)} disabled={page >= totalPages} className="px-4 py-2 border rounded-xl text-sm disabled:opacity-50 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Next</button>
        </div>
      )}

      {selectedEventId && (
        <EventDetailsModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
          currentUser={dbUser}
          onRefresh={() => fetchData(page)}
        />
      )}

      <EventQRModal
        isOpen={!!presentEvent}
        onClose={() => setPresentEvent(null)}
        event={presentEvent}
      />
    </div>
  );
}
