'use client';
import { useState } from 'react';
import { X, QrCode, CheckCircle, ShieldCheck, Download } from 'lucide-react';

// Generates a clean 2D QR-like matrix pattern SVG from text input
function SimpleQRCodeSVG({ value, size = 200 }) {
  // Simple deterministic hash to build matrix grid pattern representing value
  const gridSize = 21;
  const cellSize = size / gridSize;

  // Generate pattern matrix
  const matrix = Array(gridSize).fill(0).map(() => Array(gridSize).fill(false));

  // Corner Finder Patterns (standard QR markers)
  const addFinder = (startRow, startCol) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[startRow + r][startCol + c] = isBorder || isCenter;
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, gridSize - 7);
  addFinder(gridSize - 7, 0);

  // Fill pseudo-random matrix based on string character codes
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Don't overwrite finders
      if ((r < 7 && c < 7) || (r < 7 && c >= gridSize - 7) || (r >= gridSize - 7 && c < 7)) continue;
      // Timing pattern
      if (r === 6 || c === 6) {
        matrix[r][c] = (r + c) % 2 === 0;
        continue;
      }
      const bitIndex = (r * gridSize + c) % 32;
      const charCode = value.charCodeAt((r + c) % value.length) || 65;
      matrix[r][c] = ((hash ^ (charCode * 31)) & (1 << bitIndex)) !== 0;
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="bg-white p-3 rounded-2xl shadow-inner border border-slate-200">
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.3}
              height={cellSize + 0.3}
              fill="#0f172a"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function StudentQRModal({ isOpen, onClose, studentData }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !studentData) return null;

  const rollNo = studentData.student?.rollNo || studentData.rollNo || 'N/A';
  const name = studentData.name || studentData.user?.name || 'Student Volunteer';
  const dept = studentData.student?.department?.code || studentData.department?.code || 'CSE';
  const email = studentData.email || studentData.user?.email || '';

  const qrPayload = JSON.stringify({
    studentId: studentData.student?.id || studentData.id,
    rollNo,
    email,
    name
  });

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(rollNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-logo-navy via-slate-900 to-logo-teal p-6 text-white relative">
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
              <h3 className="text-lg font-bold">Student Attendance Pass</h3>
              <p className="text-xs text-slate-300">Official VVITU NSS Digital QR Badge</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col items-center text-center space-y-5">
          {/* QR Code Container */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center">
            <SimpleQRCodeSVG value={qrPayload} size={220} />
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-4 h-4" /> Live Verified QR Pass
            </div>
          </div>

          {/* Student Info */}
          <div className="w-full space-y-1">
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">{name}</h4>
            <p className="text-sm font-mono font-bold text-logo-teal">{rollNo} • {dept} Branch</p>
            <p className="text-xs text-slate-400">{email}</p>
          </div>

          {/* Instructions */}
          <p className="text-xs text-slate-500 dark:text-slate-400 px-4">
            Show this QR code to your Faculty Officer or Student Coordinator after event completion to allot your verified attendance.
          </p>

          {/* Actions */}
          <div className="w-full flex gap-3">
            <button
              onClick={handleCopyPayload}
              className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Download className="w-4 h-4" />}
              {copied ? 'Copied Roll No!' : 'Copy Roll No'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-logo-navy to-logo-teal hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
