'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function LandingFaqs() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "Who is eligible to join the portal?",
      a: "All enrolled undergraduate students can register to track their event participations, volunteering efforts, and service hours."
    },
    {
      q: "How are volunteering and event hours tracked?",
      a: "Hours are tracked digitally. Student coordinators mark digital attendance at each event, which automatically updates your service record on your dashboard."
    },
    {
      q: "How do I download my attendance or service certificate?",
      a: "Upon completing the required hours or event participations, your record is approved by the system administrators. You can then download your official certificate from your Portfolio tab."
    },
    {
      q: "Can I suggest or propose a new event or campaign?",
      a: "Yes! Student coordinators can propose new campaigns and events directly through the dashboard for faculty and admin review."
    }
  ];

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/40 relative z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Everything you need to know about the VVITU NSS ERP system and event structure.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-5 flex justify-between items-center text-left font-bold text-slate-800 dark:text-slate-100 cursor-pointer relative z-10"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 pt-2 border-t border-slate-50 dark:border-slate-700/40 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
