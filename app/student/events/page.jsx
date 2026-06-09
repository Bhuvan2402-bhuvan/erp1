'use client';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const EventDetailsModal = dynamic(() => import('@/components/EventDetailsModal'), {
  loading: () => <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center"><div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl"><p className="text-slate-500 animate-pulse">Loading...</p></div></div>,
});

export default function StudentEvents() {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dbUser, setDbUser] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);

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

  const handleRegister = async (eventId) => {
    const res = await fetch(`/api/events/${eventId}/register`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.message || 'Registered successfully');
      fetchData(page);
    } else {
      toast.error(data.message || 'Registration failed');
    }
  };

  const handleCancelRegistration = async (eventId) => {
    const res = await fetch(`/api/events/${eventId}/register`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Registration cancelled');
      fetchData(page);
    } else {
      toast.error('Failed to cancel registration');
    }
  };

  if (loading && events.length === 0) return <div className="text-slate-500 py-8">Loading events...</div>;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">NSS Events</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(e => (
          <div key={e.id} className={`${cardClass} p-5 cursor-pointer hover:shadow-md hover:border-logo-teal/30 transition-all`} onClick={() => setSelectedEventId(e.id)}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold">{e.title}</h4>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${e.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' : e.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>{e.status}</span>
            </div>
            {e.description && <p className="text-xs text-slate-500 mb-2">{e.description}</p>}
            <p className="text-xs text-slate-500">{e.type} • {new Date(e.date).toLocaleDateString()}</p>
            <p className="text-xs text-slate-500">{e.location}</p>
            <div className="flex gap-3 mt-3 text-xs text-slate-500">
              <span>{e._count?.registrations || 0} registered</span>
            </div>
            {e.status === 'UPCOMING' && (
              e.isRegistered ? (
                <button onClick={(evt) => { evt.stopPropagation(); handleCancelRegistration(e.id); }} className="mt-3 w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">Cancel Registration</button>
              ) : (
                <button onClick={(evt) => { evt.stopPropagation(); handleRegister(e.id); }} className="mt-3 w-full px-3 py-2 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-lg text-xs font-medium hover:opacity-90 transition shadow-sm">Register</button>
              )
            )}
          </div>
        ))}
        {events.length === 0 && <p className="text-slate-500 col-span-3 text-center py-8">No events yet.</p>}
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
    </div>
  );
}
