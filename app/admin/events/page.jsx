'use client';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { QrCode } from 'lucide-react';
import EventQRModal from '@/components/EventQRModal';

const EventDetailsModal = dynamic(() => import('@/components/EventDetailsModal'), {
  loading: () => <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center"><div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl"><p className="text-slate-500 animate-pulse">Loading...</p></div></div>,
});

export default function AdminEvents() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', endDate: '', location: '', type: 'ACTIVITY' });
  const [loading, setLoading] = useState(true);
  const [dbUser, setDbUser] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [presentEvent, setPresentEvent] = useState(null);

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events?page=${p}&limit=12`);
      const data = await res.json();
      setEvents(data.events || []);
      setPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (e) {
      console.error(e);
    }
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
    const res = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventForm) });
    if (res.ok) { 
      const data = await res.json();
      const newEventId = data.event?.id;
      setEventForm({ title: '', description: '', date: '', endDate: '', location: '', type: 'ACTIVITY' }); 
      toast.success('Event created with generated QR Code!');
      fetchData(1);
      if (data.event) {
        setPresentEvent(data.event);
      }
    } else {
      toast.error('Failed to create event');
    }
  };

  if (loading && events.length === 0) return <div className="text-slate-500 py-8">Loading events...</div>;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';
  const btnPrimary = 'px-4 py-2 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-lg hover:opacity-90 transition text-sm font-medium shadow-sm';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold">NSS Events</h2>
      <form onSubmit={handleCreateEvent} className={`${cardClass} p-6 space-y-4`}>
        <h3 className="font-semibold">Create New Event</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input placeholder="Event Title" required value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="px-3 py-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          <select value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value})} className="px-3 py-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white">
            <option value="ACTIVITY">Activity</option><option value="CAMP">Camp</option><option value="WORKSHOP">Workshop</option><option value="RALLY">Rally</option><option value="AWARENESS">Awareness</option>
          </select>
          <input type="datetime-local" required value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} className="px-3 py-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          <input placeholder="Location" value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})} className="px-3 py-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
        </div>
        <textarea placeholder="Description" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" rows={2} />
        <button type="submit" className={btnPrimary}>Create Event & Generate QR</button>
      </form>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(e => (
          <div key={e.id} className={`${cardClass} p-5 cursor-pointer hover:shadow-md hover:border-logo-teal/30 transition-all flex flex-col justify-between`} onClick={() => setSelectedEventId(e.id)}>
            <div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold">{e.title}</h4>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${e.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' : e.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>{e.status}</span>
              </div>
              <p className="text-xs text-slate-500 mb-1">{e.type} • {new Date(e.date).toLocaleDateString()}</p>
              <p className="text-xs text-slate-500">{e.location}</p>
              <div className="flex gap-4 mt-3 text-xs text-slate-500">
                <span>{e._count?.registrations || 0} registered</span>
                <span>{e._count?.attendances || 0} attended</span>
                <span>{e._count?.photos || 0} photos</span>
              </div>
            </div>

            <button
              onClick={(evt) => { evt.stopPropagation(); setPresentEvent(e); }}
              className="mt-4 w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-logo-teal hover:text-white text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <QrCode className="w-4 h-4 text-logo-teal group-hover:text-white" /> Present Event QR Code
            </button>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button onClick={() => fetchData(page - 1)} disabled={page <= 1} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Previous</button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button onClick={() => fetchData(page + 1)} disabled={page >= totalPages} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Next</button>
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
