'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, Calendar, MapPin, Tag, Users, Camera, CheckSquare, Settings, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EventDetailsModal({ eventId, onClose, currentUser, onRefresh }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // details, attendance, photos
  const [attendances, setAttendances] = useState({}); // { studentId: boolean }
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [newPhoto, setNewPhoto] = useState({ url: '', caption: '' });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const isManagement = currentUser?.role === 'ADMIN' || 
                       currentUser?.role === 'FACULTY' || 
                       currentUser?.student?.isCoordinator;

  const isAdmin = currentUser?.role === 'ADMIN';

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data.event);
        
        // Initialize attendance map from existing attendance records
        const initialAttendance = {};
        (data.event?.registrations || []).forEach(reg => {
          const matchedAtt = (data.event?.attendances || []).find(att => att.studentId === reg.studentId);
          initialAttendance[reg.studentId] = matchedAtt ? matchedAtt.present : false;
        });
        setAttendances(initialAttendance);
      } else {
        toast.error('Failed to load event details');
        onClose();
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error loading event');
    }
    setLoading(false);
  }, [eventId, onClose]);

  useEffect(() => {
    if (eventId) fetchDetails();
  }, [eventId, fetchDetails]);

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success('Event status updated');
        fetchDetails();
        if (onRefresh) onRefresh();
      } else {
        toast.error('Failed to update event status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating status');
    }
    setUpdatingStatus(false);
  };

  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event? This action is permanent.')) return;
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Event deleted successfully');
        onClose();
        if (onRefresh) onRefresh();
      } else {
        toast.error('Failed to delete event');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error deleting event');
    }
  };

  const handleToggleAttendance = (studentId) => {
    setAttendances(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    const payload = {
      attendances: Object.entries(attendances).map(([studentId, present]) => ({
        studentId,
        present
      }))
    };

    try {
      const res = await fetch(`/api/events/${eventId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success('Attendance saved successfully');
        fetchDetails();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to save attendance');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error saving attendance');
    }
    setSavingAttendance(false);
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!newPhoto.url.trim()) return;
    setUploadingPhoto(true);

    try {
      const res = await fetch(`/api/events/${eventId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPhoto)
      });
      if (res.ok) {
        toast.success('Photo added to gallery');
        setNewPhoto({ url: '', caption: '' });
        fetchDetails();
      } else {
        toast.error('Failed to add photo');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error adding photo');
    }
    setUploadingPhoto(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl text-center">
          <p className="text-slate-500 animate-pulse">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const modalClass = 'bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700 animate-slide-in';
  const tabButtonClass = (tab) => `flex-1 py-3 text-sm font-bold border-b-2 text-center transition-all ${
    activeTab === tab 
      ? 'border-logo-teal text-logo-teal' 
      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
  }`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Backdrop closer */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className={modalClass} style={{ zIndex: 1 }}>
        {/* Header banner */}
        <div className="p-6 bg-gradient-to-r from-logo-navy to-logo-teal text-white flex justify-between items-start shrink-0">
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-white/20 rounded-full tracking-wider">
              {event.type}
            </span>
            <h3 className="text-xl font-bold mt-1.5 leading-snug">{event.title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
          <button onClick={() => setActiveTab('details')} className={tabButtonClass('details')}>
            Event Details
          </button>
          {isManagement && (
            <button onClick={() => setActiveTab('attendance')} className={tabButtonClass('attendance')}>
              <span className="flex items-center justify-center gap-1.5"><CheckSquare className="w-4 h-4" /> Attendance</span>
            </button>
          )}
          <button onClick={() => setActiveTab('photos')} className={tabButtonClass('photos')}>
            <span className="flex items-center justify-center gap-1.5"><Camera className="w-4 h-4" /> Photos ({event.photos?.length || 0})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ─── TAB: DETAILS ─── */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Event Metadata row */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-logo-teal" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Date & Time</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-logo-teal" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Location</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">{event.location || 'Not set'}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Description</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {event.description || 'No description provided.'}
                </p>
              </div>

              {/* Management Controls */}
              {isManagement && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
                  <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Management Panel
                  </h4>
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Update Event Status</label>
                      <select 
                        value={event.status} 
                        disabled={updatingStatus}
                        onChange={(e) => handleStatusChange(e.target.value)} 
                        className="px-3 py-2 border rounded-xl text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-logo-teal"
                      >
                        <option value="UPCOMING">Upcoming</option>
                        <option value="ONGOING">Ongoing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={handleDeleteEvent}
                        className="mt-5 flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl transition"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Event
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: ATTENDANCE ─── */}
          {activeTab === 'attendance' && isManagement && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl">
                <div>
                  <h4 className="font-bold text-sm">Volunteer Attendance Registry</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{event.registrations?.length || 0} volunteers registered</p>
                </div>
                <button
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance || !event.registrations || event.registrations.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20"
                >
                  {savingAttendance ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
                      <th className="p-3 font-semibold">Volunteer Name</th>
                      <th className="p-3 font-semibold">Roll Number</th>
                      <th className="p-3 font-semibold text-center w-24">Present</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {event.registrations?.map(reg => (
                      <tr key={reg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <p className="font-medium">{reg.student?.user?.name}</p>
                          <p className="text-[10px] text-slate-400">{reg.student?.user?.email}</p>
                        </td>
                        <td className="p-3 font-mono text-xs text-slate-500">{reg.student?.rollNo}</td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={attendances[reg.studentId] || false}
                            onChange={() => handleToggleAttendance(reg.studentId)}
                            className="w-4 h-4 rounded text-logo-teal focus:ring-logo-teal border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                          />
                        </td>
                      </tr>
                    ))}
                    {(!event.registrations || event.registrations.length === 0) && (
                      <tr>
                        <td colSpan="3" className="p-8 text-center text-slate-400 text-xs italic">
                          No volunteers have registered for this event yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── TAB: PHOTOS ─── */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              {/* Photo Upload section (creators/admin only) */}
              {isManagement && (
                <form onSubmit={handleAddPhoto} className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" /> Upload Event Photo</h4>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      placeholder="Paste image URL (https://...)"
                      value={newPhoto.url}
                      onChange={e => setNewPhoto({ ...newPhoto, url: e.target.value })}
                      className="flex-grow px-3 py-2 border rounded-xl text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-logo-teal"
                    />
                    <input
                      placeholder="Caption (optional)"
                      value={newPhoto.caption}
                      onChange={e => setNewPhoto({ ...newPhoto, caption: e.target.value })}
                      className="w-1/3 px-3 py-2 border rounded-xl text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-logo-teal"
                    />
                    <button
                      type="submit"
                      disabled={uploadingPhoto || !newPhoto.url.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:opacity-90 disabled:opacity-50 transition"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </form>
              )}

              {/* Photo list/grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {event.photos?.map(photo => (
                  <div key={photo.id} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm group">
                    <Image
                      src={photo.url}
                      alt={photo.caption || 'Event photo'}
                      width={300}
                      height={128}
                      className="w-full h-32 object-cover hover:scale-105 transition duration-300"
                    />
                    {photo.caption && (
                      <div className="p-2 bg-slate-900/80 text-white text-[10px] absolute bottom-0 left-0 right-0 truncate" title={photo.caption}>
                        {photo.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {(!event.photos || event.photos.length === 0) && (
                <div className="text-center py-12 text-slate-400 text-xs italic">
                  No photos have been uploaded for this event.
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
