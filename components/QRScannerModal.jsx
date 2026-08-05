'use client';
import { useState, useEffect, useRef } from 'react';
import { X, QrCode, Camera, CheckCircle, AlertCircle, RefreshCw, UserCheck, Search, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QRScannerModal({ isOpen, onClose, events = [], onAttendanceMarked }) {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const videoRef = useRef(null);

  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  // Handle Camera Video Stream setup
  useEffect(() => {
    let stream = null;
    if (isOpen && scanning) {
      navigator.mediaDevices?.getUserMedia?.({ video: { facingMode: 'environment' } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.warn('Camera access error:', err);
          toast.error('Unable to access camera. Please enter student Roll No manually.');
          setScanning(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, scanning]);

  if (!isOpen) return null;

  const handleProcessScanPayload = async (payloadStr) => {
    if (!selectedEventId) {
      toast.error('Please select an event first!');
      return;
    }
    if (!payloadStr || !payloadStr.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId,
          qrPayload: payloadStr.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.alreadyMarked) {
          toast(data.message, { icon: 'ℹ️' });
        } else {
          toast.success(data.message || 'Attendance allotted! +3 Points awarded 🎉');
          setRecentScans(prev => [data, ...prev]);
          if (onAttendanceMarked) onAttendanceMarked();
        }
        setManualInput('');
      } else {
        toast.error(data.message || 'Failed to allot attendance');
      }
    } catch (err) {
      toast.error('Network error during scanning');
    }
    setSubmitting(false);
  };

  const handleManualSubmit = (e) => {
    if (e) e.preventDefault();
    handleProcessScanPayload(manualInput);
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-logo-navy via-slate-900 to-logo-teal p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white bg-white/10 rounded-full backdrop-blur-sm transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-sm">
              <QrCode className="w-6 h-6 text-logo-teal" />
            </div>
            <div>
              <h3 className="text-lg font-bold">QR Attendance Scanner & Allotment Gate</h3>
              <p className="text-xs text-slate-300">Scan student pass or enter Roll No to allot post-event attendance</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Step 1: Event Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              1. Select Target Event for Attendance Allotment
            </label>
            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-logo-teal text-slate-900 dark:text-white font-semibold text-sm"
            >
              <option value="">-- Choose an Event --</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.type}) — {ev.date ? new Date(ev.date).toLocaleDateString() : 'N/A'}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Scanner & Manual Entry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Camera View Box */}
            <div className="bg-slate-900 rounded-3xl p-4 flex flex-col items-center justify-center min-h-[220px] text-white relative overflow-hidden border border-slate-700">
              {scanning ? (
                <>
                  <video ref={videoRef} autoPlay playsInline className="w-full h-44 object-cover rounded-2xl" />
                  <div className="absolute inset-0 border-2 border-dashed border-logo-teal/70 rounded-2xl m-4 pointer-events-none animate-pulse" />
                  <button
                    onClick={() => setScanning(false)}
                    className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    Stop Camera
                  </button>
                </>
              ) : (
                <div className="text-center p-4">
                  <Camera className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-200">Live Camera Scanner</p>
                  <p className="text-xs text-slate-400 mb-4">Point device camera at student attendance pass</p>
                  <button
                    onClick={() => setScanning(true)}
                    className="px-4 py-2 bg-gradient-to-r from-logo-navy to-logo-teal text-white text-xs font-bold rounded-xl hover:opacity-90 transition shadow-sm inline-flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" /> Start Camera Scan
                  </button>
                </div>
              )}
            </div>

            {/* Quick Roll No / Token Form */}
            <div className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-3xl border border-slate-200 dark:border-slate-600 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-logo-teal" /> Quick Roll No Entry
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Or manually type student Roll No / Email to allot attendance.
                </p>

                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. 21CSE101 or student email"
                      value={manualInput}
                      onChange={e => setManualInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-logo-teal text-sm font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !manualInput.trim() || !selectedEventId}
                    className="w-full py-2.5 bg-gradient-to-r from-logo-navy to-logo-teal text-white text-xs font-bold rounded-xl hover:opacity-90 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    {submitting ? 'Allotting Attendance...' : 'Allot Attendance (+3 Pts)'}
                  </button>
                </form>
              </div>

              {selectedEvent && (
                <div className="mt-4 p-2.5 bg-logo-teal/10 rounded-xl text-xs text-logo-teal font-semibold flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Allotting for: {selectedEvent.title}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Session Live Scan Log */}
          {recentScans.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Session Allotted Attendees ({recentScans.length})
              </h4>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-800 max-h-40 overflow-y-auto">
                {recentScans.map((scan, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{scan.student?.name}</span>
                      <span className="font-mono text-slate-500 ml-2">({scan.student?.rollNo})</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md">
                      +3 Pts Allotted
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-300 transition"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
}
