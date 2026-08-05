'use client';
import { useState, useEffect, useRef } from 'react';
import { X, QrCode, Camera, CheckCircle, AlertCircle, RefreshCw, ShieldCheck, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import jsQR from 'jsqr';

export default function VolunteerQRScannerModal({ isOpen, onClose, onAttendanceMarked }) {
  const [cameraPermission, setCameraPermission] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Request camera permission and start video stream
  const startCamera = async () => {
    setScannedResult(null);
    setScanning(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera API not supported in this browser.');
        setCameraPermission('denied');
        setScanning(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      setCameraPermission('granted');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraPermission('denied');
      setScanning(false);
      toast.error('Camera access denied or unequipped. You can enter the event code manually.');
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  // Continuous frame analysis with jsQR
  useEffect(() => {
    if (!scanning || !isOpen) return;

    let isScanningActive = true;

    const scanFrame = () => {
      if (!isScanningActive) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data) {
          isScanningActive = false;
          handleScanSuccess(code.data);
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanningActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scanning, isOpen]);

  // Clean up camera on close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedResult(null);
    }
  }, [isOpen]);

  const handleScanSuccess = async (qrPayload) => {
    stopCamera();
    setProcessing(true);

    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrPayload })
      });

      const data = await res.json();
      if (res.ok) {
        setScannedResult(data);
        if (data.alreadyMarked) {
          toast(data.message || 'Attendance already marked for this event.', { icon: 'ℹ️' });
        } else {
          toast.success(data.message || 'Attendance Automatically Verified! +3 Points 🎉');
        }
        if (onAttendanceMarked) onAttendanceMarked();
      } else {
        toast.error(data.message || 'Invalid Event QR Code');
      }
    } catch (err) {
      toast.error('Network error scanning QR code');
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScanSuccess(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-logo-navy via-slate-900 to-logo-teal p-6 text-white relative shrink-0">
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white bg-white/10 rounded-full backdrop-blur-sm transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-sm">
              <Camera className="w-6 h-6 text-logo-teal" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Scan Event QR Code for Attendance</h3>
              <p className="text-xs text-slate-300">Point your camera at the Event QR presented by faculty/coordinator</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Success Card */}
          {scannedResult ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/50 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-800 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-emerald-900 dark:text-emerald-100">
                  {scannedResult.alreadyMarked ? 'Attendance Verified Previously' : 'Attendance Marked Automatically! 🎉'}
                </h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                  Event: <span className="font-bold">{scannedResult.event?.title || scannedResult.eventTitle || 'NSS Activity'}</span>
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 text-xs font-extrabold rounded-full">
                  <Zap className="w-4 h-4 text-amber-500" /> +3 Service Points Awarded
                </div>
              </div>
              <button
                onClick={() => setScannedResult(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
              >
                Scan Another QR
              </button>
            </div>
          ) : (
            <>
              {/* Camera Frame Container */}
              <div className="bg-slate-900 rounded-3xl p-4 flex flex-col items-center justify-center min-h-[260px] text-white relative overflow-hidden border border-slate-700 shadow-inner">
                {scanning ? (
                  <>
                    <video ref={videoRef} className="w-full h-56 object-cover rounded-2xl" />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Animated Scanning Box */}
                    <div className="absolute inset-6 border-2 border-logo-teal/80 rounded-2xl pointer-events-none flex items-center justify-center">
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-logo-teal to-transparent animate-pulse" />
                    </div>

                    <div className="absolute bottom-6 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-logo-teal font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> Camera active — Searching for Event QR...
                    </div>

                    <button
                      onClick={stopCamera}
                      className="absolute top-4 right-4 px-3 py-1 bg-red-600/80 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition backdrop-blur-sm"
                    >
                      Pause Camera
                    </button>
                  </>
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-16 h-16 bg-white/10 text-logo-teal rounded-3xl flex items-center justify-center mx-auto">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold">Live Camera Attendance Scanner</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                        Camera permission is required to scan the event QR code directly.
                      </p>
                    </div>

                    {cameraPermission === 'denied' && (
                      <div className="p-3 bg-rose-500/10 text-rose-400 text-xs rounded-xl border border-rose-500/30 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Camera access denied by browser settings. Please allow camera permissions or enter the code below.</span>
                      </div>
                    )}

                    <button
                      onClick={startCamera}
                      disabled={processing}
                      className="px-6 py-3 bg-gradient-to-r from-logo-navy to-logo-teal text-white text-xs font-bold rounded-2xl hover:opacity-90 transition shadow-md inline-flex items-center gap-2"
                    >
                      {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      {processing ? 'Processing QR...' : 'Start Camera Scan'}
                    </button>
                  </div>
                )}
              </div>

              {/* Manual Code Input Option */}
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-600">
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Event QR Token (e.g. NSS-EVT-...)"
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-logo-teal"
                  />
                  <button
                    type="submit"
                    disabled={processing || !manualCode.trim()}
                    className="px-4 py-2 bg-logo-teal text-white text-xs font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50"
                  >
                    Submit Code
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-300 transition"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
}
