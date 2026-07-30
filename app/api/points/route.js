import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { validate, awardPointsSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';

const pointsLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

export const GET = withAuth(async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (studentId) {
      const logs = await prisma.pointsLog.findMany({
        where: { studentId },
        include: {
          awardedBy: { select: { name: true, role: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ logs }, { status: 200 });
    }

    const leaderboard = await prisma.student.findMany({
      where: {
        user: { approvalStatus: 'APPROVED', isBlocked: false }
      },
      select: {
        id: true,
        rollNo: true,
        year: true,
        section: true,
        points: true,
        user: { select: { name: true, avatarUrl: true } },
        department: { select: { name: true, code: true } }
      },
      orderBy: { points: 'desc' },
      take: 20
    });

    return NextResponse.json({ leaderboard }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching points history');
  }
});

export const POST = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    const isCallerAdmin = dbUser.role === 'ADMIN';
    const isCallerFaculty = dbUser.role === 'FACULTY';
    const isCallerCoord = dbUser.role === 'STUDENT' && dbUser.student?.isCoordinator;

    if (!isCallerAdmin && !isCallerFaculty && !isCallerCoord) {
      return NextResponse.json({ message: 'Forbidden. Only Coordinators, Faculty, or Admins can award points.' }, { status: 403 });
    }

    // Rate limit: 30 points awards per user per minute
    const { success: withinLimit } = pointsLimiter.check(30, `points:${dbUser.id}`);
    if (!withinLimit) {
      return NextResponse.json({ message: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    const body = await req.json();
    const { success, data: validated, error: validationError } = validate(awardPointsSchema, body);
    if (!success) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const { studentId, points: pointsNum, reason } = validated;

    // Prevent self-awarding points
    if (dbUser.student?.id === studentId) {
      return NextResponse.json({ message: 'You cannot award points to yourself.' }, { status: 403 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true }
    });

    if (!student) {
      return NextResponse.json({ message: 'Student volunteer not found' }, { status: 404 });
    }

    // Department Scoping check: Faculty and Coordinators can only award points to branch students
    if (!isCallerAdmin) {
      const callerDeptId = isCallerFaculty ? dbUser.faculty?.departmentId : dbUser.student?.departmentId;
      if (!callerDeptId || student.departmentId !== callerDeptId) {
        return NextResponse.json({ message: 'Forbidden. You can only award points to students in your own department.' }, { status: 403 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.pointsLog.create({
        data: {
          studentId,
          awardedById: dbUser.id,
          points: pointsNum,
          reason
        }
      });

      const updatedStudent = await tx.student.update({
        where: { id: studentId },
        data: {
          points: { increment: pointsNum }
        }
      });

      await tx.notification.create({
        data: {
          userId: student.userId,
          title: 'Points Awarded! 🎉',
          message: `You were awarded +${pointsNum} points by ${dbUser.name} for: "${reason}". Total Points: ${updatedStudent.points}`,
          type: 'INFO'
        }
      });

      return { log, updatedStudent };
    });

    return NextResponse.json({
      message: `Successfully awarded +${pointsNum} points to ${student.user.name}!`,
      data: result
    }, { status: 200 });

  } catch (error) {
    return sanitizeErrorResponse(error, 'Error awarding points');
  }
});
