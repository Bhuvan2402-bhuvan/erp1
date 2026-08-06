'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Camera, Calendar, MapPin, Building2, Search, Filter, Eye, X, Tag } from 'lucide-react';

export default function EventGallery({ initialPhotos = [], showTitle = true }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [loading, setLoading] = useState(initialPhotos.length === 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetch('/api/events/gallery?status=ALL')
      .then(res => res.json())
      .then(data => {
        if (data.photos) setPhotos(data.photos);
      })
      .catch(err => console.error('Failed to load event photos gallery:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredPhotos = photos.filter(p => {
    const matchesSearch = (p.caption || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.eventTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.eventLocation || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !selectedDept || p.departmentCode === selectedDept || p.departmentName === selectedDept;
    return matchesSearch && matchesDept;
  });

  // Extract unique departments for filter dropdown
  const departmentOptions = Array.from(
    new Map(photos.map(p => [p.departmentCode, p.departmentName])).entries()
  );

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-logo-teal" /> Event Photos & Activity Gallery
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Browse event highlights, photos, and captions posted by faculty and coordinators across all branches.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-logo-teal/10 text-logo-teal text-xs font-extrabold rounded-full border border-logo-teal/20">
              {filteredPhotos.length} Photos
            </span>
          </div>
        </div>
      )}

      {/* Filter and Search controls */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by event title or caption..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-logo-teal"
          />
        </div>

        {departmentOptions.length > 0 && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full md:w-56 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-logo-teal"
            >
              <option value="">All Academic Branches</option>
              {departmentOptions.map(([code, name]) => (
                <option key={code} value={code}>{name} ({code})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
          Loading event gallery...
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs italic bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
          No event photos found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map(photo => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group flex flex-col"
            >
              {/* Photo Thumbnail */}
              <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-900">
                <Image
                  src={photo.url}
                  alt={photo.caption || photo.eventTitle || 'Event Photo'}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                  unoptimized={photo.url.startsWith('data:')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-90" />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 text-[10px] font-extrabold rounded-full backdrop-blur-md shadow-sm border border-white/20">
                  {photo.departmentCode || 'NSS'}
                </span>
                <span className="absolute top-3 right-3 px-2.5 py-1 bg-logo-teal/90 text-white text-[10px] font-extrabold rounded-full backdrop-blur-md uppercase">
                  {photo.eventType || 'EVENT'}
                </span>
                {photo.eventTitle && (
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h4 className="font-bold text-sm leading-tight drop-shadow truncate">{photo.eventTitle}</h4>
                  </div>
                )}
              </div>

              {/* Photo Caption & Meta */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium line-clamp-3">
                  {photo.caption || <span className="italic text-slate-400">No caption provided.</span>}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="w-3.5 h-3.5 text-logo-teal" />
                    <span>{photo.eventDate ? new Date(photo.eventDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Event Date'}</span>
                  </div>
                  {photo.uploadedBy && (
                    <span className="font-semibold text-slate-500 dark:text-slate-400 truncate">
                      By {photo.uploadedBy}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Full Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-4xl w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition z-10">
              <X className="w-5 h-5" />
            </button>
            <div className="relative h-[420px] w-full bg-black">
              <Image
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || selectedPhoto.eventTitle || 'Event Photo'}
                fill
                className="object-contain"
                unoptimized={selectedPhoto.url.startsWith('data:')}
              />
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="px-3 py-1 bg-logo-teal/10 text-logo-teal text-xs font-bold rounded-full border border-logo-teal/20">
                  {selectedPhoto.departmentName} ({selectedPhoto.departmentCode})
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {selectedPhoto.eventDate ? new Date(selectedPhoto.eventDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) : ''}
                </span>
              </div>
              <h3 className="text-xl font-bold">{selectedPhoto.eventTitle}</h3>
              {selectedPhoto.caption && (
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{selectedPhoto.caption}</p>
              )}
              {selectedPhoto.uploadedBy && (
                <p className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  Posted by <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedPhoto.uploadedBy}</span> ({selectedPhoto.uploaderRole})
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
