import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';

// POST /api/attendance/scan — Mark student attendance after an event via QR scan
export const POST = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    const isCallerAdmin = dbUser.role === 'ADMIN';
    const isCallerFaculty = dbUser.role === 'FACULTY';
    const isCallerCoordinator = dbUser.role === 'STUDENT' && dbUser.student?.isCoordinator;
    const isCallerStudent = dbUser.role === 'STUDENT' && dbUser.student;

    const body = await req.json();
    const { eventId: bodyEventId, qrPayload, rollNo: rawRollNo, studentId: rawStudentId } = body;

    let targetEventId = bodyEventId;
    let scannedRollNo = rawRollNo;
    let scannedStudentId = rawStudentId;
    let isEventScan = false;

    if (qrPayload) {
      try {
        const parsed = typeof qrPayload === 'string' && qrPayload.startsWith('{') ? JSON.parse(qrPayload) : { rollNo: qrPayload, code: qrPayload };
        if (parsed.type === 'EVENT_ATTENDANCE' || parsed.eventId || parsed.qrCode) {
          isEventScan = true;
          if (parsed.eventId) targetEventId = parsed.eventId;
          if (parsed.qrCode) scannedRollNo = parsed.qrCode;
        } else {
          if (parsed.studentId) scannedStudentId = parsed.studentId;
          if (parsed.rollNo) scannedRollNo = parsed.rollNo;
        }
      } catch (e) {
        if (typeof qrPayload === 'string' && qrPayload.startsWith('NSS-EVT-')) {
          isEventScan = true;
        } else {
          scannedRollNo = qrPayload;
        }
      }
    }

    // Check permissions:
    // If scanning an Event QR (isEventScan), any logged in student/volunteer can scan it for themselves.
    // Otherwise (scanning student pass), caller must be Admin, Faculty, or Coordinator.
    if (isEventScan) {
      if (!isCallerStudent) {
        return NextResponse.json({ message: 'Must be a registered student/volunteer to scan event QR codes.' }, { status: 403 });
      }
      scannedStudentId = dbUser.student.id;
    } else {
      if (!isCallerAdmin && !isCallerFaculty && !isCallerCoordinator) {
        return NextResponse.json({ message: 'Forbidden. Only faculty or student coordinators can scan student passes.' }, { status: 403 });
      }
    }

    // Locate event
    let event = null;
    if (targetEventId) {
      event = await prisma.event.findUnique({ where: { id: targetEventId } });
    }
    if (!event && typeof qrPayload === 'string' && qrPayload.startsWith('NSS-EVT-')) {
      event = await prisma.event.findUnique({ where: { qrCode: qrPayload } });
    }
    if (!event && isEventScan && scannedRollNo) {
      event = await prisma.event.findFirst({
        where: { OR: [{ id: scannedRollNo }, { qrCode: scannedRollNo }] }
      });
    }

    if (!event) {
      return NextResponse.json({ message: 'Event not found or invalid QR code.' }, { status: 404 });
    }

    targetEventId = event.id;

    // Find student profile
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          scannedStudentId ? { id: scannedStudentId } : undefined,
          scannedRollNo ? { rollNo: scannedRollNo } : undefined,
          scannedRollNo ? { user: { email: scannedRollNo } } : undefined
        ].filter(Boolean)
      },
      include: {
        user: { select: { id: true, name: true, email: true, departmentId: true } },
        department: { select: { name: true, code: true } }
      }
    });

    if (!student) {
      return NextResponse.json({ message: `Student profile not found for scanned payload (${scannedRollNo || scannedStudentId})` }, { status: 404 });
    }

    // Check if attendance already logged
    const existingAttendance = await prisma.eventAttendance.findUnique({
      where: {
        eventId_studentId: { eventId, studentId: student.id }
      }
    });

    if (existingAttendance && existingAttendance.present) {
      return NextResponse.json({
        alreadyMarked: true,
        message: `Attendance already allotted for ${student.user.name} (${student.rollNo})`,
        student: {
          id: student.id,
          name: student.user.name,
          rollNo: student.rollNo,
          department: student.department?.code
        },
        eventTitle: event.title
      }, { status: 200 });
    }

    // Record attendance & award service points in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Record attendance
      await tx.eventAttendance.upsert({
        where: { eventId_studentId: { eventId, studentId: student.id } },
        update: { present: true, markedById: dbUser.id },
        create: { eventId, studentId: student.id, present: true, markedById: dbUser.id }
      });

      // 2. Ensure event registration exists
      await tx.eventRegistration.upsert({
        where: { eventId_studentId: { eventId, studentId: student.id } },
        update: { status: 'REGISTERED' },
        create: { eventId, studentId: student.id, status: 'REGISTERED' }
      });

      // 3. Award +3 service points for attending event
      const POINTS_AWARDED = 3;
      await tx.student.update({
        where: { id: student.id },
        data: { points: { increment: POINTS_AWARDED } }
      });

      await tx.pointsLog.create({
        data: {
          studentId: student.id,
          awardedById: dbUser.id,
          points: POINTS_AWARDED,
          reason: `Attendance allotted for event: ${event.title}`
        }
      });

      // 4. Send notification to student
      await tx.notification.create({
        data: {
          userId: student.userId,
          title: 'Attendance Verified! ✅',
          message: `Your attendance for "${event.title}" has been verified by ${dbUser.name}. +3 service points earned!`,
          type: 'INFO'
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: `Attendance successfully allotted to ${student.user.name} (+3 Points)`,
      student: {
        id: student.id,
        name: student.user.name,
        rollNo: student.rollNo,
        department: student.department?.code || 'CSE'
      },
      event: {
        id: event.id,
        title: event.title,
        date: event.date
      },
      scannedAt: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    return sanitizeErrorResponse(error, 'Error scanning QR attendance');
  }
});
