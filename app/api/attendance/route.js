import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/attendance — Fetch attendance records
export async function GET(request) {
  try {
    const userContext = await getUser();
    if (!userContext || !userContext.dbUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { dbUser } = userContext;

    // Access protection
    if (dbUser.isBlocked) {
      return NextResponse.json({ success: false, message: 'Account is blocked' }, { status: 403 });
    }
    if (dbUser.approvalStatus !== 'APPROVED' && dbUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Account pending approval' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const studentId = searchParams.get('studentId');

    const where = {};
    if (eventId) where.eventId = eventId;
    if (studentId) where.studentId = studentId;

    const attendances = await prisma.eventAttendance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        event: { select: { title: true, date: true } },
        student: { include: { user: { select: { name: true, email: true } }, department: true } },
        markedBy: { select: { name: true, email: true } }
      }
    });

    return NextResponse.json({ attendances });
  } catch (error) {
    console.error('[GET /api/attendance]', error);
    return NextResponse.json({ message: 'Error fetching attendance records' }, { status: 500 });
  }
}

// POST /api/attendance — Mark attendance
export async function POST(request) {
  try {
    const userContext = await getUser();
    if (!userContext || !userContext.dbUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { dbUser } = userContext;

    // Access protection
    if (dbUser.isBlocked) {
      return NextResponse.json({ success: false, message: 'Account is blocked' }, { status: 403 });
    }
    if (dbUser.approvalStatus !== 'APPROVED' && dbUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Account pending approval' }, { status: 403 });
    }

    const body = await request.json();
    const { eventId, studentId, present } = body;

    if (!eventId || !studentId) {
      return NextResponse.json({ message: 'Event ID and Student ID are required' }, { status: 400 });
    }

    const attendance = await prisma.eventAttendance.upsert({
      where: { eventId_studentId: { eventId, studentId } },
      create: {
        eventId,
        studentId,
        present: present !== undefined ? Boolean(present) : true,
        markedById: dbUser.id
      },
      update: {
        present: present !== undefined ? Boolean(present) : true,
        markedById: dbUser.id
      }
    });

    // Auto reward points if present
    if (attendance.present) {
      await prisma.student.update({
        where: { id: studentId },
        data: { points: { increment: 10 } }
      });
    }

    return NextResponse.json({ message: 'Attendance marked', attendance });
  } catch (error) {
    console.error('[POST /api/attendance]', error);
    return NextResponse.json({ message: 'Error marking attendance' }, { status: 500 });
  }
}
