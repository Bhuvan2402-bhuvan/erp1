import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';
import { warningSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

// GET /api/warnings — List warnings (scoped)
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

    const where = {};
    if (dbUser.role === 'STUDENT') {
      if (!dbUser.student) {
        return NextResponse.json({ success: false, message: 'Student profile not active' }, { status: 400 });
      }
      if (dbUser.student.isCoordinator) {
        where.student = { departmentId: dbUser.student.departmentId };
      } else {
        where.studentId = dbUser.student.id;
      }
    } else if (dbUser.role === 'FACULTY') {
      if (dbUser.faculty?.departmentId) {
        where.student = { departmentId: dbUser.faculty.departmentId };
      }
    }

    const warnings = await prisma.warningLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            department: { select: { name: true, code: true } }
          }
        },
        issuedBy: { select: { name: true } }
      }
    });

    return NextResponse.json({ success: true, warnings });
  } catch (error) {
    console.error('[GET /api/warnings]', error);
    return NextResponse.json({ success: false, message: 'Error fetching warnings' }, { status: 500 });
  }
}

// POST /api/warnings — Issue a new warning (Admins/Faculty/Coordinators)
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

    const isCoordinator = dbUser.student?.isCoordinator;
    const isManager = dbUser.role === 'ADMIN' || dbUser.role === 'FACULTY' || isCoordinator;

    if (!isManager) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = warningSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      }, { status: 400 });
    }

    const data = validation.data;

    // Ensure student exists
    const targetStudent = await prisma.student.findUnique({ where: { id: data.studentId } });
    if (!targetStudent) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.warningLog.create({
        data: {
          studentId: data.studentId,
          issuedById: dbUser.id,
          reason: data.reason,
          proofUrl: data.proofUrl || null
        }
      });

      const updatedStudent = await tx.student.update({
        where: { id: data.studentId },
        data: { warnings: { increment: 1 } }
      });

      // Auto-block volunteer if warnings reach 3
      if (updatedStudent.warnings >= 3) {
        await tx.user.update({
          where: { id: targetStudent.userId },
          data: { isBlocked: true }
        });
      }

      // Create notification
      await tx.notification.create({
        data: {
          userId: targetStudent.userId,
          title: `Disciplinary Warning Issued ⚠️ (${updatedStudent.warnings}/3)`,
          message: `A warning has been issued by ${dbUser.name} for: "${data.reason}". ${updatedStudent.warnings >= 3 ? 'Your account has been automatically suspended.' : ''}`,
          type: 'ALERT'
        }
      });

      return log;
    });

    return NextResponse.json({ success: true, message: 'Warning issued successfully', warning: result }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/warnings]', error);
    return NextResponse.json({ success: false, message: 'Error issuing warning' }, { status: 500 });
  }
}
