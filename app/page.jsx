export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Users, Clock, ArrowRight, Activity, Shield, Award, Star } from 'lucide-react';
import prisma from '@/lib/prisma';
import LandingNavbar from '@/components/LandingNavbar';
import LandingHero from '@/components/LandingHero';
import LandingTestimonials from '@/components/LandingTestimonials';
import LandingFaqs from '@/components/LandingFaqs';
import { DEFAULT_FACULTY_PROFILES } from '@/lib/faculty-defaults';

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

    let facultyProfiles = DEFAULT_FACULTY_PROFILES;
    try {
      const dbFaculty = await prisma.facultyDesk.findMany({
        where: { isVisible: true },
        orderBy: [
          { role: 'asc' },
          { sortOrder: 'asc' },
          { createdAt: 'asc' }
        ]
      });
      if (dbFaculty && dbFaculty.length > 0) {
        facultyProfiles = dbFaculty.sort((a, b) => {
          if (a.role === 'NSS_PC' && b.role !== 'NSS_PC') return -1;
          if (a.role !== 'NSS_PC' && b.role === 'NSS_PC') return 1;
          return (a.sortOrder || 0) - (b.sortOrder || 0);
        }).map(p => ({
          ...p,
          achievements: Array.isArray(p.achievements) ? p.achievements : []
        }));
      }
    } catch (e) {
      console.error('Faculty desk query error, using defaults:', e);
    }

    const pcLeader = facultyProfiles.find(f => f.role === 'NSS_PC') || facultyProfiles[0];
    const poLeaders = facultyProfiles.filter(f => f.role !== 'NSS_PC');

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

        {/* ── NSS FACULTY LEADERSHIP & PROGRAM OFFICERS SHOWCASE ── */}
        <section className="py-24 bg-white dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800/50 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full bg-logo-teal/10 dark:bg-logo-teal/20 text-logo-teal text-xs font-extrabold uppercase tracking-wider mb-3">
                  <Shield className="w-3.5 h-3.5" /> Institutional Leadership
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  NSS Faculty Officers & Leadership
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base max-w-2xl">
                  Meet the Program Coordinator and Branch Program Officers mentoring volunteers across academic disciplines.
                </p>
              </div>

              <a
                href="/visitor?tab=faculty"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-logo-navy to-logo-teal text-white font-bold text-xs sm:text-sm hover:opacity-90 shadow-md hover:scale-[1.02] transition self-start md:self-auto cursor-pointer"
              >
                <span>View Full Visitor Directory</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="space-y-10">
              {/* Program Coordinator (PC) Spotlight Card */}
              {pcLeader && (
                <div className="bg-gradient-to-br from-slate-900 via-logo-navy to-slate-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden border border-slate-800">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-logo-teal/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-8">
                    {/* Avatar */}
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-amber-400 via-logo-teal to-blue-500 p-1 shrink-0 shadow-xl">
                      <div className="w-full h-full rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center text-3xl font-black text-white">
                        {pcLeader.photoUrl ? (
                          <Image src={pcLeader.photoUrl} alt={pcLeader.name} width={144} height={144} className="w-full h-full object-cover" unoptimized />
                        ) : (
                          pcLeader.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 text-center lg:text-left space-y-4">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase mb-2">
                          <Star className="w-3.5 h-3.5 fill-current text-amber-400" /> Program Coordinator (PC)
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black text-white">{pcLeader.name}</h3>
                        <p className="text-sm text-slate-300 font-medium">{pcLeader.designation} &bull; {pcLeader.branch}</p>
                      </div>

                      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-left">
                        <p className="text-xs uppercase font-extrabold text-amber-300 tracking-wider mb-2">Message to Volunteers & Community</p>
                        <p className="text-xs sm:text-sm italic text-slate-200 leading-relaxed">&ldquo;{pcLeader.foreword}&rdquo;</p>
                      </div>

                      {Array.isArray(pcLeader.achievements) && pcLeader.achievements.length > 0 && (
                        <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-1">
                          {pcLeader.achievements.map((ach, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-slate-200 border border-white/15">
                              <Award className="w-3.5 h-3.5 text-amber-400" /> {ach}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Program Officers (POs) Cards Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-logo-teal" /> Department Program Officers (POs)
                  </h3>
                  <a href="/visitor?tab=faculty" className="text-xs font-bold text-logo-teal hover:underline">
                    View all ({poLeaders.length}) officers &rarr;
                  </a>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {poLeaders.map((po) => (
                    <div
                      key={po.id}
                      className="bg-slate-50 dark:bg-slate-800/80 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:border-logo-teal/30 transition flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-logo-navy to-logo-teal text-white flex items-center justify-center text-base font-black shrink-0 overflow-hidden shadow-sm">
                            {po.photoUrl ? (
                              <Image src={po.photoUrl} alt={po.name} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                            ) : (
                              po.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-logo-teal/10 text-logo-teal border border-logo-teal/20">
                              NSS PO
                            </span>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate mt-0.5">{po.name}</h4>
                            <p className="text-[11px] font-bold text-logo-navy dark:text-logo-teal truncate">{po.branch}</p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 italic leading-relaxed">
                          &ldquo;{po.foreword}&rdquo;
                        </p>
                      </div>

                      {Array.isArray(po.achievements) && po.achievements.length > 0 && (
                        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            <Award className="w-3 h-3 text-amber-500" /> {po.achievements[0]}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
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
          <a href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-logo-navy hover:bg-slate-50 font-bold rounded-full shadow-xl transition-all duration-300 hover:scale-[1.03] cursor-pointer relative z-30">
            Start Registering Now
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-16 relative z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image src="/vvit-logo.jpg" alt="VVIT Logo" width={80} height={40} className="h-9 w-auto object-contain bg-white p-1 rounded-lg" />
              <div className="h-6 w-px bg-slate-700" />
              <Image src="/nss-logo.png" alt="NSS Logo" width={100} height={40} className="h-9 w-auto object-contain bg-white p-1 rounded-lg" />
              <span className="font-extrabold text-base text-white tracking-tight">
                VVITU NSS ERP
              </span>
            </div>
            <p className="text-xs leading-relaxed">
              VVITU NSS ERP - empowering students to coordinate events, track attendance, and log service records efficiently.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li><a href="/login" className="hover:text-white transition cursor-pointer">Sign In Portal</a></li>
              <li><a href="/signup" className="hover:text-white transition cursor-pointer">Volunteer Registration</a></li>
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

            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-xs font-bold text-white mb-2 uppercase tracking-wider">Follow Us</p>
              <div className="flex items-center gap-3">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-800 hover:bg-logo-teal hover:text-white transition text-xs font-bold">Instagram</a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-800 hover:bg-logo-teal hover:text-white transition text-xs font-bold">LinkedIn</a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-800 hover:bg-logo-teal hover:text-white transition text-xs font-bold">Twitter/X</a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-800 hover:bg-logo-teal hover:text-white transition text-xs font-bold">YouTube</a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-12 border-t border-slate-800 text-center text-[10px] tracking-wider uppercase">
          &copy; {new Date().getFullYear()} Bhuvana Mohan Chowdary. All Rights Reserved.
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
