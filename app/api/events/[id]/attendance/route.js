import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';
import { markAttendanceSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

// GET /api/events/:id/attendance — Get attendance roster for managers
export async function GET(request, { params }) {
  try {
    const userContext = await getUser();
    if (!userContext || !userContext.dbUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { dbUser } = userContext;
    const { id: eventId } = params;

    // Access protection
    if (dbUser.isBlocked) {
      return NextResponse.json({ success: false, message: 'Account is blocked' }, { status: 403 });
    }
    if (dbUser.approvalStatus !== 'APPROVED' && dbUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Account pending approval' }, { status: 403 });
    }

    const isManager = dbUser.role === 'ADMIN' ||
                      dbUser.role === 'FACULTY' ||
                      dbUser.student?.isCoordinator === true;

    if (!isManager) {
      return NextResponse.json({ success: false, message: 'Forbidden. Only coordinators, faculty, or admins can view attendance rosters.' }, { status: 403 });
    }

    const attendances = await prisma.eventAttendance.findMany({
      where: { eventId },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            department: { select: { name: true, code: true } }
          }
        },
        markedBy: { select: { name: true } }
      }
    });

    return NextResponse.json({ success: true, attendances });
  } catch (error) {
    console.error('[GET /api/events/:id/attendance]', error);
    return NextResponse.json({ success: false, message: 'Error fetching event attendance registry' }, { status: 500 });
  }
}

// POST /api/events/:id/attendance — Bulk save attendance (using single prisma transaction)
export async function POST(request, { params }) {
  try {
    const userContext = await getUser();
    if (!userContext || !userContext.dbUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { dbUser } = userContext;
    const { id: eventId } = params;

    // Access protection
    if (dbUser.isBlocked) {
      return NextResponse.json({ success: false, message: 'Account is blocked' }, { status: 403 });
    }
    if (dbUser.approvalStatus !== 'APPROVED' && dbUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Account pending approval' }, { status: 403 });
    }

    const isCoordinator = dbUser.student?.isCoordinator;
    const isManager = dbUser.role === 'ADMIN' || dbUser.role === 'FACULTY' || isCoordinator;

    if (!isManager) {
      return NextResponse.json({ success: false, message: 'Only coordinators, faculty, or admins can mark attendance' }, { status: 403 });
    }

    const body = await request.json();
    const validation = markAttendanceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      }, { status: 400 });
    }

    const { attendances } = validation.data;

    const presentStudentIds = attendances.filter(a => a.present).map(a => a.studentId);
    let newPresentIds = [];

    if (presentStudentIds.length > 0) {
      // Find students who were ALREADY marked present before this request
      const existingPresentAttendances = await prisma.eventAttendance.findMany({
        where: {
          eventId,
          studentId: { in: presentStudentIds },
          present: true
        }
      });
      const alreadyPresentIds = existingPresentAttendances.map(a => a.studentId);
      newPresentIds = presentStudentIds.filter(id => !alreadyPresentIds.includes(id));
    }

    // Run transaction
    const results = await prisma.$transaction(
      attendances.map(({ studentId, present }) =>
        prisma.eventAttendance.upsert({
          where: { eventId_studentId: { eventId, studentId } },
          update: { present, markedById: dbUser.id },
          create: { eventId, studentId, present, markedById: dbUser.id }
        })
      )
    );

    if (newPresentIds.length > 0) {
      await prisma.student.updateMany({
        where: { id: { in: newPresentIds } },
        data: { points: { increment: 10 } }
      });
      await prisma.pointsLog.createMany({
        data: newPresentIds.map(sid => ({
          studentId: sid,
          points: 10,
          reason: `Attended Event ID: ${eventId}`,
          awardedById: dbUser.id
        }))
      });
    }

    return NextResponse.json({ success: true, message: `Marked ${results.length} records`, count: results.length });
  } catch (error) {
    console.error('[POST /api/events/:id/attendance]', error);
    return NextResponse.json({ success: false, message: 'Error marking bulk attendance' }, { status: 500 });
  }
}
