export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const [totalVolunteers, totalEvents, totalAttendances] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT', approvalStatus: 'APPROVED' } }),
      prisma.event.count(),
      prisma.eventAttendance.count({ where: { present: true } })
    ]);

    // Fetch 3 most recent/upcoming events
    const events = await prisma.event.findMany({
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

    // Format events
    const formattedEvents = events.map(e => ({
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

    // Calculate dynamic hours (e.g. 10 hours base per volunteer + 3 hours per present attendance)
    const baseHours = totalVolunteers * 10;
    const computedHours = baseHours + (totalAttendances * 3);

    return NextResponse.json({
      stats: {
        totalVolunteers,
        totalEvents,
        totalHours: computedHours || 12000,
        totalAttendances
      },
      events: formattedEvents
    }, { 
      status: 200,
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240' }
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    return NextResponse.json({ message: 'Error fetching stats' }, { status: 500 });
  }
}
