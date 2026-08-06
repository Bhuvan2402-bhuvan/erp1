'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, Calendar, MapPin, Tag, Users, Camera, CheckSquare, Settings, Trash2, Plus, Edit3, Save, Upload, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

// Client-side image compressor for photo uploads
const compressImageFile = (file, maxWidth = 1024, maxHeight = 1024, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function EventDetailsModal({ eventId, onClose, currentUser, onRefresh }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // details, attendance, photos
  const [attendances, setAttendances] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [newPhoto, setNewPhoto] = useState({ url: '', caption: '' });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Edit Mode state for event details
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    type: 'ACTIVITY',
    status: 'UPCOMING'
  });

  // Selected Photo for Lightbox Preview
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const fileInputRef = useRef(null);

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
        setEditForm({
          title: data.event.title || '',
          description: data.event.description || '',
          date: data.event.date ? new Date(data.event.date).toISOString().slice(0, 16) : '',
          location: data.event.location || '',
          type: data.event.type || 'ACTIVITY',
          status: data.event.status || 'UPCOMING'
        });
        
        // Initialize attendance map
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

  const handleUpdateEvent = async (e) => {
    if (e) e.preventDefault();
    setSavingDetails(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        toast.success('Event details updated successfully');
        setIsEditingDetails(false);
        fetchDetails();
        if (onRefresh) onRefresh();
      } else {
        const errData = await res.json();
        toast.error(errData.message || 'Failed to update event details');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating event details');
    }
    setSavingDetails(false);
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

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 1024, 1024, 0.8);
      setNewPhoto(prev => ({ ...prev, url: compressedDataUrl }));
      toast.success('Image loaded! Add a caption and click Post Photo.');
    } catch {
      toast.error('Failed to process image file');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!newPhoto.url.trim()) {
      toast.error('Please select an image file or provide an image URL');
      return;
    }
    setUploadingPhoto(true);

    try {
      const res = await fetch(`/api/events/${eventId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPhoto)
      });
      if (res.ok) {
        toast.success('Event photo posted to gallery');
        setNewPhoto({ url: '', caption: '' });
        fetchDetails();
        if (onRefresh) onRefresh();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to post photo');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error posting photo');
    }
    setUploadingPhoto(false);
  };

  const handleDeletePhoto = async (photoId) => {
    if (!confirm('Are you sure you want to delete this event photo?')) return;
    try {
      const res = await fetch(`/api/events/${eventId}/photos?photoId=${photoId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Photo removed');
        fetchDetails();
        if (onRefresh) onRefresh();
      } else {
        toast.error('Failed to delete photo');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error deleting photo');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl text-center">
          <p className="text-slate-500 animate-pulse font-medium">Loading event details...</p>
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
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 bg-white/20 rounded-full tracking-wider">
                {event.type}
              </span>
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                event.status === 'COMPLETED' ? 'bg-emerald-500/80 text-white' :
                event.status === 'ONGOING' ? 'bg-amber-500/80 text-white' :
                event.status === 'CANCELLED' ? 'bg-red-500/80 text-white' :
                'bg-blue-500/80 text-white'
              }`}>
                {event.status}
              </span>
            </div>
            <h3 className="text-xl font-bold mt-2 leading-snug">{event.title}</h3>
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

              {isEditingDetails ? (
                /* EDIT FORM FOR COORDINATORS / FACULTY / ADMIN */
                <form onSubmit={handleUpdateEvent} className="space-y-4 bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">Update Event Information</h4>
                    <button
                      type="button"
                      onClick={() => setIsEditingDetails(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancel Edit
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Event Title</label>
                    <input
                      type="text"
                      required
                      value={editForm.title}
                      onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-logo-teal"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Event Category</label>
                      <select
                        value={editForm.type}
                        onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-logo-teal"
                      >
                        <option value="ACTIVITY">Activity</option>
                        <option value="CAMP">Camp</option>
                        <option value="WORKSHOP">Workshop</option>
                        <option value="RALLY">Rally</option>
                        <option value="AWARENESS">Awareness</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                      <select
                        value={editForm.status}
                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-logo-teal font-semibold"
                      >
                        <option value="UPCOMING">Upcoming</option>
                        <option value="ONGOING">Ongoing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={editForm.date}
                        onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-logo-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Location</label>
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                        placeholder="e.g. Main Auditorium / Village Outreach Site"
                        className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-logo-teal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description / Outcome Report</label>
                    <textarea
                      rows={4}
                      value={editForm.description}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Add event details, objectives, or summary after completion..."
                      className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-logo-teal"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingDetails(false)}
                      className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingDetails}
                      className="px-5 py-2 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition"
                    >
                      <Save className="w-4 h-4" /> {savingDetails ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                /* VIEW DETAILS */
                <>
                  {/* Event Metadata row */}
                  <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-logo-teal" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Date & Time</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(event.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
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
                    <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Description & Report</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {event.description || 'No description provided for this event.'}
                    </p>
                  </div>

                  {/* Management Panel */}
                  {isManagement && (
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Settings className="w-4 h-4" /> Management Actions
                        </h4>
                        <button
                          onClick={() => setIsEditingDetails(true)}
                          className="px-3 py-1.5 bg-logo-teal/10 hover:bg-logo-teal/20 text-logo-teal text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-logo-teal/30"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit Event Details
                        </button>
                      </div>

                      {isAdmin && (
                        <div className="flex justify-end pt-2">
                          <button 
                            onClick={handleDeleteEvent}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl transition"
                          >
                            <Trash2 className="w-4 h-4" /> Delete Event
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
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
                    <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700 text-slate-500 text-xs uppercase font-bold">
                      <th className="p-3">Volunteer Name</th>
                      <th className="p-3">Roll Number</th>
                      <th className="p-3 text-center w-24">Present</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {event.registrations?.map(reg => (
                      <tr key={reg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <p className="font-medium text-slate-800 dark:text-slate-100">{reg.student?.user?.name}</p>
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
              {/* Photo Upload section for Coordinators, Faculty, Admin */}
              {isManagement && (
                <form onSubmit={handleAddPhoto} className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-logo-teal" /> Post Event Photo (Faculty & Coordinators)
                    </h4>
                  </div>

                  {/* Upload choice: File or URL */}
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5 text-logo-teal" /> Select Image File
                    </button>
                    <span className="text-xs text-slate-400 font-semibold uppercase">Or</span>
                    <input
                      type="url"
                      placeholder="Paste image URL (https://...)"
                      value={newPhoto.url.startsWith('data:') ? '[Local Image Selected]' : newPhoto.url}
                      onChange={e => setNewPhoto({ ...newPhoto, url: e.target.value })}
                      className="flex-grow px-3 py-2 border rounded-xl text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-logo-teal"
                    />
                  </div>

                  <div className="flex gap-2 items-center">
                    <input
                      placeholder="Enter photo caption / event highlight details..."
                      value={newPhoto.caption}
                      onChange={e => setNewPhoto({ ...newPhoto, caption: e.target.value })}
                      className="flex-grow px-3 py-2 border rounded-xl text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-logo-teal"
                    />
                    <button
                      type="submit"
                      disabled={uploadingPhoto || !newPhoto.url.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:opacity-90 disabled:opacity-50 transition shadow-sm shrink-0"
                    >
                      <Plus className="w-4 h-4" /> {uploadingPhoto ? 'Posting...' : 'Post Photo'}
                    </button>
                  </div>
                </form>
              )}

              {/* Photo list/grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {event.photos?.map(photo => (
                  <div key={photo.id} className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm group">
                    <div className="relative h-36 w-full cursor-pointer" onClick={() => setPreviewPhoto(photo)}>
                      <Image
                        src={photo.url}
                        alt={photo.caption || 'Event photo'}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-300"
                        unoptimized={photo.url.startsWith('data:')}
                      />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Eye className="w-6 h-6 text-white drop-shadow-md" />
                      </div>
                    </div>

                    {photo.caption && (
                      <div className="p-2.5 bg-slate-900/90 text-white text-[11px] font-medium leading-tight line-clamp-2">
                        {photo.caption}
                      </div>
                    )}

                    {isManagement && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 hover:bg-red-600 text-white transition opacity-0 group-hover:opacity-100"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {(!event.photos || event.photos.length === 0) && (
                <div className="text-center py-12 text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  No photos uploaded for this event yet. Coordinators and faculty can upload event photos above.
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Lightbox / Photo Full Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setPreviewPhoto(null)}>
          <div className="relative max-w-3xl w-full bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewPhoto(null)} className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition z-10">
              <X className="w-5 h-5" />
            </button>
            <div className="relative h-96 w-full bg-black">
              <Image
                src={previewPhoto.url}
                alt={previewPhoto.caption || 'Event photo preview'}
                fill
                className="object-contain"
                unoptimized={previewPhoto.url.startsWith('data:')}
              />
            </div>
            {previewPhoto.caption && (
              <div className="p-6 bg-slate-900 border-t border-slate-800">
                <p className="text-sm font-semibold text-slate-200 leading-relaxed">{previewPhoto.caption}</p>
                {previewPhoto.uploadedBy?.name && (
                  <p className="text-xs text-slate-400 mt-2">Posted by {previewPhoto.uploadedBy.name}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
