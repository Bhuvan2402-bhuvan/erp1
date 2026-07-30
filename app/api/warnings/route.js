import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { validate, issueWarningSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';
import { sendWarningNoticeEmail } from '@/lib/email';

const warningLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

export const GET = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    let where = {};

    if (dbUser.role === 'STUDENT') {
      if (!dbUser.student?.id) {
        return NextResponse.json({ warnings: [] }, { status: 200 });
      }
      if (dbUser.student.isCoordinator) {
        // Student Coordinators can view warnings for their department
        const deptId = dbUser.student.departmentId;
        if (studentId) {
          const targetStudent = await prisma.student.findUnique({ where: { id: studentId } });
          if (!targetStudent || targetStudent.departmentId !== deptId) {
            return NextResponse.json({ message: 'Forbidden. Student is not in your department.' }, { status: 403 });
          }
          where.studentId = studentId;
        } else {
          where.student = { departmentId: deptId };
        }
      } else {
        // Regular volunteers can only see their own warnings
        where.studentId = dbUser.student.id;
      }
    } else if (dbUser.role === 'FACULTY') {
      // Faculty can only see warnings for students in their department
      const deptId = dbUser.faculty?.departmentId;
      if (!deptId) return NextResponse.json({ warnings: [] }, { status: 200 });
      if (studentId) {
        // Verify target student belongs to this faculty's department
        const targetStudent = await prisma.student.findUnique({ where: { id: studentId } });
        if (!targetStudent || targetStudent.departmentId !== deptId) {
          return NextResponse.json({ message: 'Forbidden. Student is not in your department.' }, { status: 403 });
        }
        where.studentId = studentId;
      } else {
        where.student = { departmentId: deptId };
      }
    } else {
      // ADMIN — can see all, optionally filtered by studentId
      if (studentId) where.studentId = studentId;
    }

    const warnings = await prisma.warningLog.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            department: { select: { name: true, code: true } }
          }
        },
        issuedBy: { select: { name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ warnings }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching warning logs');
  }
});

export const POST = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    const isCallerAdmin = dbUser.role === 'ADMIN';
    const isCallerFaculty = dbUser.role === 'FACULTY';
    const isCallerCoord = dbUser.role === 'STUDENT' && dbUser.student?.isCoordinator;

    if (!isCallerAdmin && !isCallerFaculty && !isCallerCoord) {
      return NextResponse.json({ message: 'Forbidden. Only Coordinators, Faculty, or Admins can issue warnings.' }, { status: 403 });
    }

    // Rate limit: 15 warnings per user per minute
    const { success: withinLimit } = warningLimiter.check(15, `warning:${dbUser.id}`);
    if (!withinLimit) {
      return NextResponse.json({ message: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    const body = await req.json();
    const { success, data: validated, error: validationError } = validate(issueWarningSchema, body);
    if (!success) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const { studentId, reason, proofUrl } = validated;

    // Prevent self-warning
    if (dbUser.student?.id === studentId) {
      return NextResponse.json({ message: 'You cannot issue a warning to yourself.' }, { status: 403 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true }
    });

    if (!student) {
      return NextResponse.json({ message: 'Student volunteer not found' }, { status: 404 });
    }

    // Department Scoping check: Faculty and Coordinators can only issue warnings to branch students
    if (!isCallerAdmin) {
      const callerDeptId = isCallerFaculty ? dbUser.faculty?.departmentId : dbUser.student?.departmentId;
      if (!callerDeptId || student.departmentId !== callerDeptId) {
        return NextResponse.json({ message: 'Forbidden. You can only issue warnings to students in your own department.' }, { status: 403 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const warning = await tx.warningLog.create({
        data: {
          studentId,
          issuedById: dbUser.id,
          reason,
          proofUrl: proofUrl || null
        }
      });

      const updatedStudent = await tx.student.update({
        where: { id: studentId },
        data: {
          warnings: { increment: 1 }
        }
      });

      await tx.notification.create({
        data: {
          userId: student.userId,
          title: 'Warning Notice Issued ⚠️',
          message: `Official warning issued by ${dbUser.name} for: "${reason}". Total Warning Count: ${updatedStudent.warnings}`,
          type: 'WARNING'
        }
      });

      // Dispatch transactional email via Resend
      if (student.user?.email) {
        sendWarningNoticeEmail(student.user, reason, updatedStudent.warnings).catch(err => console.error(err));
      }

      return { warning, updatedStudent };
    });

    return NextResponse.json({
      message: `Warning successfully issued to ${student.user.name}`,
      data: result
    }, { status: 201 });

  } catch (error) {
    return sanitizeErrorResponse(error, 'Error issuing warning');
  }
});
