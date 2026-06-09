import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';

// GET /api/attendance/export — Export attendance as CSV (Excel-compatible)
// Query params: departmentId, from, to

function sanitizeCsvValue(val) {
  const str = String(val ?? '');
  // Prevent CSV formula injection
  if (/^[=+\-@\t\r]/.test(str)) return `'${str}`;
  return str.replace(/"/g, '""'); // escape double quotes
}

export async function GET(req) {
  try {
    const auth = await requireRole(['ADMIN', 'FACULTY']);
    if (!auth.authorized) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Build event filter
    const eventWhere = {};
    if (from) {
      const fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        return NextResponse.json({ message: 'Invalid from date format' }, { status: 400 });
      }
      eventWhere.date = { ...(eventWhere.date || {}), gte: fromDate };
    }
    if (to) {
      const toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        return NextResponse.json({ message: 'Invalid to date format' }, { status: 400 });
      }
      eventWhere.date = { ...(eventWhere.date || {}), lte: toDate };
    }

    // Build student filter
    const studentWhere = {};
    if (departmentId) studentWhere.departmentId = departmentId;

    // Get all events in range
    const events = await prisma.event.findMany({
      where: eventWhere,
      orderBy: { date: 'asc' },
      select: { id: true, title: true, date: true }
    });

    // Get all students in department
    const students = await prisma.student.findMany({
      where: studentWhere,
      include: {
        user: { select: { name: true, email: true } },
        department: { select: { code: true } },
        eventAttendances: {
          where: { eventId: { in: events.map(e => e.id) } }
        }
      },
      orderBy: { rollNo: 'asc' }
    });

    // Build CSV
    const headers = ['Roll No', 'Name', 'Email', 'Branch', ...events.map(e => `${e.title} (${new Date(e.date).toLocaleDateString()})`)];
    const rows = students.map(s => {
      const row = [s.rollNo, s.user.name, s.user.email, s.department.code];
      events.forEach(e => {
        const att = s.eventAttendances.find(a => a.eventId === e.id);
        row.push(att ? (att.present ? 'P' : 'A') : '-');
      });
      return row;
    });

    const csv = [headers.map(v => `"${sanitizeCsvValue(v)}"`).join(','), ...rows.map(r => r.map(v => `"${sanitizeCsvValue(v)}"`).join(','))].join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="attendance_${departmentId || 'all'}_${from || 'start'}_${to || 'end'}.csv"`
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error exporting attendance' }, { status: 500 });
  }
}
