export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Users, Clock, ArrowRight, Activity } from 'lucide-react';
import prisma from '@/lib/prisma';
import LandingNavbar from '@/components/LandingNavbar';
import LandingHero from '@/components/LandingHero';
import LandingTestimonials from '@/components/LandingTestimonials';
import LandingFaqs from '@/components/LandingFaqs';

export default async function Home() {
  let stats = {
    totalVolunteers: 500,
    totalEvents: 85,
    totalHours: 12000,
    totalAttendances: 150
  };

  let events = [
    {
      title: "Mega Blood Donation Camp",
      type: "CAMP",
      status: "UPCOMING",
      date: "May 28, 2026",
      location: "Main Seminar Hall",
      registrations: 124,
      color: "from-rose-500 to-red-500",
      desc: "Annual blood drive in collaboration with Red Cross Society. Every donor receives a verified service certificate."
    },
    {
      title: "Green Campus Plantation Drive",
      type: "ACTIVITY",
      status: "ONGOING",
      date: "May 24, 2026",
      location: "Hostel Grounds",
      registrations: 89,
      color: "from-emerald-500 to-teal-500",
      desc: "Planting over 500 indigenous tree saplings across the university campus to promote carbon neutrality."
    },
    {
      title: "Tech Literacy Workshop",
      type: "WORKSHOP",
      status: "COMPLETED",
      date: "May 15, 2026",
      location: "NSS Seminar Room",
      registrations: 45,
      color: "from-blue-500 to-indigo-500",
      desc: "Interactive sessions teaching computer basics, typing, and digital safety to local primary school children."
    }
  ];

  try {
    const [totalVolunteers, totalEvents, totalAttendances] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT', approvalStatus: 'APPROVED' } }),
      prisma.event.count(),
      prisma.eventAttendance.count({ where: { present: true } })
    ]);

    const dbEvents = await prisma.event.findMany({
      take: 3,
      orderBy: { date: 'desc' },
      include: {
        _count: { select: { registrations: true } }
      }
    });

    const colorMap = {
      CAMP: "from-rose-500 to-red-500",
      ACTIVITY: "from-logo-green to-logo-teal",
      WORKSHOP: "from-logo-navy to-logo-teal",
      RALLY: "from-logo-green to-logo-navy",
      AWARENESS: "from-logo-amber to-logo-gold"
    };

    const formattedEvents = dbEvents.map(e => ({
      id: e.id,
      title: e.title,
      type: e.type,
      status: e.status,
      date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      location: e.location || 'Campus',
      registrations: e._count.registrations,
      color: colorMap[e.type] || "from-slate-500 to-slate-600",
      desc: e.description || 'No description provided.'
    }));

    const baseHours = totalVolunteers * 10;
    const computedHours = baseHours + (totalAttendances * 3);

    stats = {
      totalVolunteers,
      totalEvents,
      totalHours: computedHours || 12000,
      totalAttendances
    };

    if (formattedEvents.length > 0) {
      events = formattedEvents;
    }
  } catch (err) {
    console.error('Failed to load landing page data from DB, using fallbacks:', err);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col font-sans overflow-x-hidden relative selection:bg-logo-teal selection:text-white">
      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none z-0" />
      
      {/* Global Navbar */}
      <LandingNavbar />

      {/* Hero Section */}
      <LandingHero stats={stats} />

      {/* Impact Stats Grid Section */}
      <section className="py-12 bg-white dark:bg-slate-900 border-y border-slate-200/50 dark:border-slate-800/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: "Active Volunteers", value: `${stats.totalVolunteers}+`, desc: "Registered and audited", icon: Users, color: "text-logo-teal bg-logo-teal/10 dark:bg-logo-teal/20" },
              { label: "Total Service Hours", value: `${stats.totalHours.toLocaleString()}+`, desc: "Verified community work", icon: Clock, color: "text-logo-green bg-logo-green/10 dark:bg-logo-green/20" },
              { label: "Campaigns Executed", value: `${stats.totalEvents}+`, desc: "Blood camps, drives, rallies", icon: Activity, color: "text-logo-amber bg-logo-amber/10 dark:bg-logo-amber/20" },
              { label: "Total Attendances", value: `${stats.totalAttendances}+`, desc: "Verified event presences", icon: BookOpenIcon, color: "text-logo-navy bg-logo-navy/10 dark:bg-logo-navy/20 dark:text-logo-teal" },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="flex gap-4 items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color} shrink-0 shadow-sm`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{stat.value}</h4>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{stat.label}</p>
                    <p className="text-[10px] text-slate-400">{stat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Event Preview Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/40 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
              Active Campaigns & Events
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Explore ongoing and upcoming volunteering drives. Sign up today and earn your credits while contributing to society.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {events.map((evt, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-200/40 dark:border-slate-700/40 overflow-hidden flex flex-col h-full group hover:shadow-xl hover:-translate-y-1 transition duration-300"
              >
                {/* Header card color bar */}
                <div className={`h-3 bg-gradient-to-r ${evt.color}`} />
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 tracking-wider">
                      {evt.type}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider ${
                      evt.status === 'UPCOMING' ? 'bg-logo-navy/10 dark:bg-logo-navy/20 text-logo-navy dark:text-logo-teal' :
                      evt.status === 'ONGOING' ? 'bg-logo-green/10 dark:bg-logo-green/20 text-logo-green dark:text-logo-green' :
                      'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {evt.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 leading-snug group-hover:text-logo-teal transition-colors">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-3 leading-relaxed">
                    {evt.desc}
                  </p>

                  <div className="mt-auto space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{evt.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{evt.registrations} registered volunteers</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Volunteer Testimonials Section */}
      <LandingTestimonials />

      {/* Accordion FAQ Section */}
      <LandingFaqs />

      {/* Premium CTA Section */}
      <section className="py-20 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-logo-navy to-logo-teal dark:from-logo-navy/70 dark:to-logo-teal/30 -z-10" />
        <div className="max-w-4xl mx-auto px-4 text-center text-white relative">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 leading-tight">
            Ready to make a difference in community?
          </h2>
          <p className="text-slate-100/80 dark:text-slate-300 mb-10 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Create an account, view assigned village outreach programs, coordinate events, and build your digital community portfolio.
          </p>
          <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-logo-navy hover:bg-slate-50 font-bold rounded-full shadow-xl transition-all duration-300 hover:scale-[1.03]">
            Start Registering Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-16 relative z-10 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center">
              <Image src="/logo.png" alt="SAMP Logo" width={110} height={50} className="object-contain bg-white/10 p-1.5 rounded-lg" />
            </div>
            <p className="text-xs leading-relaxed">
              student attendance management portal - empowering students to coordinate events, track attendance, and log service records efficiently.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li><Link href="/login" className="hover:text-white transition">Sign In Portal</Link></li>
              <li><Link href="/signup" className="hover:text-white transition">Volunteer Registration</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Core Programs</h4>
            <ul className="space-y-2 text-xs">
              <li>Mega Blood Donation Camps</li>
              <li>Village Adoption & Surveys</li>
              <li>Plantation Campaigns</li>
              <li>Youth Literacy Workshops</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Contact Coordinator</h4>
            <p className="text-xs leading-relaxed text-slate-300">
              <span className="font-semibold text-white">Bhuvana Mohan Chowdary</span><br />
              Guntur, Andhra Pradesh, India
            </p>
            <p className="text-xs font-bold text-slate-300 mt-2">Email: <a href="mailto:yenugabhuvanamohanchowdary@gmail.com" className="hover:underline text-logo-teal">yenugabhuvanamohanchowdary@gmail.com</a></p>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-12 border-t border-slate-800 text-center text-[10px] tracking-wider uppercase">
          &copy; {new Date().getFullYear()} student attendance management portal. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}

// Custom simple book open icon
function BookOpenIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
