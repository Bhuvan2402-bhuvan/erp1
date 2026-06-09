import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { validate, markAttendanceSchema } from '@/lib/validations';

// GET /api/events/[id]/attendance — Get attendance for an event
export const GET = withAuth(async (req, { params }) => {
  try {
    const { id: eventId } = params;
    const attendances = await prisma.eventAttendance.findMany({
      where: { eventId },
      include: {
        student: { include: { user: { select: { name: true, email: true } }, department: { select: { name: true, code: true } } } },
        markedBy: { select: { name: true } }
      }
    });
    return NextResponse.json({ attendances }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching attendance');
  }
});

// POST /api/events/[id]/attendance — Mark attendance (Admin, Faculty, Coordinator)
// Uses a single transaction instead of N individual upserts
export const POST = withAuth(async (req, { params, user }) => {
  try {
    const { dbUser } = user;
    const isCoordinator = dbUser.student?.isCoordinator;
    if (dbUser.role === 'STUDENT' && !isCoordinator) {
      return NextResponse.json({ message: 'Only coordinators can mark attendance' }, { status: 403 });
    }

    const body = await req.json();
    const { success, data, error: validationError } = validate(markAttendanceSchema, body);
    if (!success) return NextResponse.json({ message: validationError }, { status: 400 });

    const { id: eventId } = params;
    const { attendances } = data;

    // Batch all upserts inside a single database transaction
    const results = await prisma.$transaction(
      attendances.map(({ studentId, present }) =>
        prisma.eventAttendance.upsert({
          where: { eventId_studentId: { eventId, studentId } },
          update: { present, markedById: dbUser.id },
          create: { eventId, studentId, present, markedById: dbUser.id }
        })
      )
    );

    return NextResponse.json({ message: `Marked ${results.length} records`, count: results.length }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error marking attendance');
  }
});
