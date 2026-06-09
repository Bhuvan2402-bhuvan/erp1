'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function CoordinatorCreateEvent() {
  const router = useRouter();
  const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', location: '', type: 'ACTIVITY' });
  const [loading, setLoading] = useState(true);
  const [isCoordinator, setIsCoordinator] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (!data.user || !data.user.student?.isCoordinator) {
          router.push('/student');
        } else {
          setIsCoordinator(true);
          setLoading(false);
        }
      })
      .catch(() => router.push('/student'));
  }, [router]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventForm) });
    if (res.ok) {
      toast.success('Event created successfully');
      setEventForm({ title: '', description: '', date: '', location: '', type: 'ACTIVITY' });
    } else {
      const data = await res.json();
      toast.error(data.message || 'Failed to create event');
    }
  };

  if (loading || !isCoordinator) return <div className="text-slate-500 py-8">Loading...</div>;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';
  const btnPrimary = 'px-4 py-2 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-lg hover:opacity-90 transition text-sm font-medium shadow-sm';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Post New Event</h2>
      <form onSubmit={handleCreateEvent} className={`${cardClass} p-6 space-y-4`}>
        <input placeholder="Event Title" required value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
        <div className="grid grid-cols-2 gap-4">
          <input type="datetime-local" required value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} className="px-3 py-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          <input placeholder="Location" value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})} className="px-3 py-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
        </div>
        <select value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white">
          <option value="ACTIVITY">Activity</option><option value="CAMP">Camp</option><option value="WORKSHOP">Workshop</option><option value="RALLY">Rally</option><option value="AWARENESS">Awareness</option>
        </select>
        <textarea placeholder="Description" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" rows={3} />
        <button type="submit" className={btnPrimary}>Create Event</button>
      </form>
    </div>
  );
}
