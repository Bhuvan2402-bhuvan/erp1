"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  List, 
  MessageSquare, 
  ShieldCheck, 
  Users, 
  Calendar, 
  DollarSign, 
  FileText, 
  Bell, 
  QrCode, 
  Award, 
  HardDriveDownload,
  Lock,
  Sparkles,
  ArrowRight
} from "lucide-react";

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [showNotes, setShowNotes] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const totalSlides = 14;

  const slides = [
    {
      id: 1,
      tag: "Slide 01 // Executive Overview",
      title: "VVITU NSS ERP Platform Overview",
      type: "overview"
    },
    {
      id: 2,
      tag: "Slide 02 // Governance Framework",
      title: "System Roles & Quota Caps",
      type: "governance"
    },
    {
      id: 3,
      tag: "Slide 03 // Technical Stack",
      title: "System Architecture & Tech Stack",
      type: "architecture"
    },
    {
      id: 4,
      tag: "Slide 04 // Public Portal",
      title: "Public Visitor Portal & Guest Pages",
      type: "visitor"
    },
    {
      id: 5,
      tag: "Slide 05 // Student Panel",
      title: "Student Volunteer Workspace & Features",
      type: "student"
    },
    {
      id: 6,
      tag: "Slide 06 // Coordinator Deck",
      title: "Student Coordinator Management Operations",
      type: "coordinator"
    },
    {
      id: 7,
      tag: "Slide 07 // Faculty Operations",
      title: "Faculty Coordinator Governance & Operations",
      type: "faculty"
    },
    {
      id: 8,
      tag: "Slide 08 // Admin Control",
      title: "System Administrator Master Control Deck",
      type: "admin"
    },
    {
      id: 9,
      tag: "Slide 09 // Deep Dive 1",
      title: "Anti-Proxy QR Gate & Gamified Points Engine",
      type: "qr_points"
    },
    {
      id: 10,
      tag: "Slide 10 // Deep Dive 2",
      title: "Financial Ledger & Circular Broadcast Engine",
      type: "finance_broadcast"
    },
    {
      id: 11,
      tag: "Slide 11 // Deep Dive 3",
      title: "1:1 Grievances & Enterprise Data Backup",
      type: "grievances_backup"
    },
    {
      id: 12,
      tag: "Slide 12 // Page Mapping",
      title: "Master Page Route & Account Feature Matrix",
      type: "matrix"
    },
    {
      id: 13,
      tag: "Slide 13 // Security & Hardening",
      title: "Security, Rate Limiting & Validation Framework",
      type: "security"
    },
    {
      id: 14,
      tag: "Slide 14 // Conclusion",
      title: "Conclusion & Live Impact Summary",
      type: "conclusion"
    }
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight" || e.key === "Space") {
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => Math.max(prev - 1, 1));
      } else if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Header */}
      <header className="h-16 px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            VVITU NSS ERP
          </span>
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
            Interactive Presentation Deck
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            {showNotes ? "Hide Notes" : "Show Notes"}
          </button>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition"
          >
            <List className="w-3.5 h-3.5 text-purple-400" />
            Slide Index
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1.5 transition"
          >
            <Maximize className="w-3.5 h-3.5" />
            Fullscreen
          </button>
        </div>
      </header>

      {/* Main Slide Display Area */}
      <main className="flex-1 relative flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950">
        <div className="w-full max-w-6xl h-[80vh] bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl flex flex-col justify-between overflow-y-auto">
          
          {/* Slide Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
                {slides[currentSlide - 1].tag}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                {slides[currentSlide - 1].title}
              </h1>
            </div>
            <div className="text-sm font-semibold bg-slate-800 border border-slate-700 px-3 py-1 rounded-xl text-slate-400">
              {currentSlide} / {totalSlides}
            </div>
          </div>

          {/* Dynamic Content by Slide */}
          <div className="flex-1 flex flex-col gap-6 justify-center">
            {currentSlide === 1 && (
              <div className="space-y-6">
                <p className="text-slate-300 text-lg leading-relaxed">
                  A Centralized, Role-Governed Enterprise Resource Planning & Anti-Proxy Attendance Platform tailored for Academic Volunteering Drives, Financial Ledgers, and Grievance Resolution.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                    <ShieldCheck className="w-8 h-8 text-indigo-400 mb-2" />
                    <h3 className="font-bold text-white mb-1">Role Governance</h3>
                    <p className="text-xs text-slate-400">Hard capped limits for Admin (4), Faculty (15), and Coordinators (20).</p>
                  </div>
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                    <Calendar className="w-8 h-8 text-purple-400 mb-2" />
                    <h3 className="font-bold text-white mb-1">25+ Page Routes</h3>
                    <p className="text-xs text-slate-400">Dedicated, role-segregated navigation interfaces across all 5 accounts.</p>
                  </div>
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                    <QrCode className="w-8 h-8 text-emerald-400 mb-2" />
                    <h3 className="font-bold text-white mb-1">Anti-Proxy QR</h3>
                    <p className="text-xs text-slate-400">Time-sensitive TOTP dynamic QR code verification with audit signatures.</p>
                  </div>
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                    <HardDriveDownload className="w-8 h-8 text-amber-400 mb-2" />
                    <h3 className="font-bold text-white mb-1">1-Click Backup</h3>
                    <p className="text-xs text-slate-400">Complete JSON data export for financial records, attendance logs, and reports.</p>
                  </div>
                </div>
              </div>
            )}

            {currentSlide === 2 && (
              <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950/60">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/80 text-indigo-300 font-semibold">
                    <tr>
                      <th className="p-3">Role Tier</th>
                      <th className="p-3">Account Quota</th>
                      <th className="p-3">Registration Path</th>
                      <th className="p-3">Primary Scope</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    <tr>
                      <td className="p-3 font-semibold text-indigo-400">Public Visitor</td>
                      <td className="p-3">Unlimited</td>
                      <td className="p-3">Unauthenticated Guest</td>
                      <td className="p-3">Read-only public stats & verified roster</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-blue-400">Student Volunteer</td>
                      <td className="p-3">Unlimited</td>
                      <td className="p-3">Self Sign-Up (/signup)</td>
                      <td className="p-3">Event registration, QR scan, profile & myBharat</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-emerald-400">Student Coordinator</td>
                      <td className="p-3 font-bold text-emerald-400">Max 20</td>
                      <td className="p-3">Promoted by Faculty/Admin</td>
                      <td className="p-3">Branch roster, point allocation, warnings</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-amber-400">Faculty Coordinator</td>
                      <td className="p-3 font-bold text-amber-400">Max 15</td>
                      <td className="p-3">Faculty Sign-Up -&gt; Admin Approval</td>
                      <td className="p-3">Department ops, finance ledger, circular broadcasts</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-rose-400">System Admin</td>
                      <td className="p-3 font-bold text-rose-400">Max 4</td>
                      <td className="p-3">Super Admin Provisioning</td>
                      <td className="p-3">Master dashboard, universal approvals, full backup</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {currentSlide === 12 && (
              <div className="overflow-x-auto max-h-[50vh] border border-slate-800 rounded-2xl bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-indigo-300 font-semibold sticky top-0">
                    <tr>
                      <th className="p-2.5">Page Route</th>
                      <th className="p-2.5">Public Guest</th>
                      <th className="p-2.5">Volunteer</th>
                      <th className="p-2.5">Student Coord</th>
                      <th className="p-2.5">Faculty Coord</th>
                      <th className="p-2.5">System Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    <tr><td className="p-2.5 font-mono">/ & /visitor</td><td className="p-2.5 text-emerald-400">✅ Public</td><td className="p-2.5">✅ View</td><td className="p-2.5">✅ View</td><td className="p-2.5">✅ View</td><td className="p-2.5">✅ View</td></tr>
                    <tr><td className="p-2.5 font-mono">/student/events</td><td className="p-2.5 text-rose-400">❌</td><td className="p-2.5 text-emerald-400">✅ Register</td><td className="p-2.5 text-emerald-400">✅ Register</td><td className="p-2.5">View</td><td className="p-2.5">View</td></tr>
                    <tr><td className="p-2.5 font-mono">/student/attendance</td><td className="p-2.5 text-rose-400">❌</td><td className="p-2.5 text-emerald-400">✅ Scan QR</td><td className="p-2.5 text-emerald-400">✅ Scan/Generate</td><td className="p-2.5 text-emerald-400">Scan/Generate</td><td className="p-2.5 text-emerald-400">Scan/Generate</td></tr>
                    <tr><td className="p-2.5 font-mono">/student/profile</td><td className="p-2.5 text-rose-400">❌</td><td className="p-2.5 text-emerald-400">✅ Full Control</td><td className="p-2.5 text-emerald-400">✅ Full Control</td><td className="p-2.5">View</td><td className="p-2.5">View</td></tr>
                    <tr><td className="p-2.5 font-mono">/student/volunteers</td><td className="p-2.5 text-rose-400">❌</td><td className="p-2.5 text-rose-400">❌</td><td className="p-2.5 text-emerald-400">✅ Manage Branch</td><td className="p-2.5 text-emerald-400">✅ Manage Branch</td><td className="p-2.5 text-emerald-400">Full Control</td></tr>
                    <tr><td className="p-2.5 font-mono">/faculty/finance</td><td className="p-2.5 text-rose-400">❌</td><td className="p-2.5 text-rose-400">❌</td><td className="p-2.5">View Ledger</td><td className="p-2.5 text-emerald-400">✅ Full Control</td><td className="p-2.5 text-emerald-400">Full Control</td></tr>
                    <tr><td className="p-2.5 font-mono">/admin/overview</td><td className="p-2.5 text-rose-400">❌</td><td className="p-2.5 text-rose-400">❌</td><td className="p-2.5 text-rose-400">❌</td><td className="p-2.5 text-rose-400">❌</td><td className="p-2.5 text-emerald-400">✅ Master Control</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {currentSlide !== 1 && currentSlide !== 2 && currentSlide !== 12 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl">
                  <h3 className="text-lg font-bold text-indigo-300 mb-2">Core Features & Functions</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    This module provides specialized interface routes for high-efficiency management, real-time data synchronization, and automated verification checks.
                  </p>
                </div>
                <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl">
                  <h3 className="text-lg font-bold text-purple-300 mb-2">Security & Quota Enforcement</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    All page actions are validated by Next.js Serverless Middleware and Prisma ORM filters to ensure zero unauthorized privilege escalation.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Speaker Notes */}
          {showNotes && (
            <div className="mt-4 p-3 bg-indigo-500/10 border border-dashed border-indigo-500/30 rounded-xl flex items-start gap-2.5 text-xs text-slate-300">
              <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong>Speaker Notes:</strong> Use the Left/Right arrow keys or Next/Prev buttons to navigate. All slide data is mapped directly from system specifications.
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Navigation Controls */}
      <footer className="h-16 px-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">
          Slide {currentSlide} of {totalSlides}
        </span>

        {/* Progress Bar */}
        <div className="flex-1 max-w-md mx-6 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${((currentSlide - 1) / (totalSlides - 1)) * 100}%` }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 1))}
            disabled={currentSlide === 1}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 rounded-lg flex items-center gap-1 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides))}
            disabled={currentSlide === totalSlides}
            className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg flex items-center gap-1 transition"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* Slide Index Modal */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Slide Index Navigator</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
              >
                ✕ Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  onClick={() => {
                    setCurrentSlide(slide.id);
                    setIsMenuOpen(false);
                  }}
                  className={`p-3 border rounded-xl cursor-pointer transition ${
                    currentSlide === slide.id
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                  }`}
                >
                  <div className="text-[10px] font-bold text-indigo-400 uppercase">{slide.tag}</div>
                  <div className="text-sm font-semibold text-slate-200">{slide.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
