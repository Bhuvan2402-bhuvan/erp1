'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const FALLBACK = [
  {
    name: "Bhuvana Mohan",
    role: "Student Coordinator",
    dept: "CSE Dept",
    quote: "This portal has taught me that the smallest acts of service can bring the biggest smiles. Managing volunteers on this platform is incredibly fast, structured, and easy.",
    avatar: "BM"
  },
  {
    name: "Dr. K. Srinivasan",
    role: "Program Officer",
    dept: "Mechanical Dept",
    quote: "This portal has completely digitized our operations. Event creation, registrations, attendance tracking, and volunteer hour auditing are now fully transparent.",
    avatar: "KS"
  },
  {
    name: "Ananya Rao",
    role: "Volunteer Student",
    dept: "ECE Dept",
    quote: "Participating in campaigns is extremely fulfilling. I can easily register for events, check my attendance history, and download certificates directly from my student portfolio.",
    avatar: "AR"
  }
];

export default function LandingTestimonials() {
  const [activeTab, setActiveTab] = useState(0);
  const [testimonials, setTestimonials] = useState(FALLBACK);

  useEffect(() => {
    fetch('/api/testimonials')
      .then(r => r.json())
      .then(data => {
        if (data.testimonials && data.testimonials.length > 0) {
          setTestimonials(data.testimonials);
          setActiveTab(0);
        }
      })
      .catch(() => {/* silently use fallback */});
  }, []);

  const active = testimonials[activeTab] || testimonials[0];

  return (
    <section className="py-24 bg-white dark:bg-slate-900 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            User Experiences
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Hear from our student leaders, volunteers, and faculty coordinators on how community service shapes character.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-8 lg:p-12 shadow-xl flex flex-col md:flex-row gap-12 items-center">
          
          {/* Testimonial Left Sidebar Tabs */}
          <div className="flex flex-row md:flex-col gap-4 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 pb-6 md:pb-0 md:pr-6 justify-center md:justify-start">
            {testimonials.map((item, idx) => (
              <button
                key={item.id || idx}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`w-full text-left px-5 py-3 rounded-2xl flex items-center gap-4 transition-all duration-300 font-semibold cursor-pointer relative z-10 ${
                  activeTab === idx 
                    ? 'bg-white dark:bg-slate-800 shadow-md text-logo-teal border border-slate-100 dark:border-slate-700/50' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold ${
                  activeTab === idx ? 'bg-logo-teal/10 text-logo-teal dark:bg-logo-teal/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  {item.avatar}
                </div>
                <div className="hidden sm:block min-w-0">
                  <p className="text-sm truncate leading-none mb-1">{item.name}</p>
                  <p className="text-[10px] text-slate-500 leading-none">{item.role}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Testimonial Active Quote Area */}
          <div className="flex-1 min-h-[200px] flex flex-col justify-between">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="text-logo-teal/20 dark:text-logo-teal/10">
                <Quote className="w-16 h-16 fill-current leading-none" />
              </div>
              <p className="text-lg sm:text-xl font-medium text-slate-700 dark:text-slate-300 italic leading-relaxed">
                &ldquo;{active.quote}&rdquo;
              </p>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">{active.name}</h4>
                <p className="text-xs text-slate-500">{active.role} &bull; {active.dept}</p>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
