import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';
import { certificateSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

// GET /api/certificates — List certificates (scoped)
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
      // If student is coordinator, let them see all certificates in branch
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

    const certificates = await prisma.certificate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            department: { select: { name: true, code: true } }
          }
        }
      }
    });

    return NextResponse.json({ success: true, certificates });
  } catch (error) {
    console.error('[GET /api/certificates]', error);
    return NextResponse.json({ success: false, message: 'Error fetching certificates' }, { status: 500 });
  }
}

// POST /api/certificates — Award certificate (Admins/Faculty/Coordinators)
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
      return NextResponse.json({ success: false, message: 'Forbidden: Insufficient permissions to issue certificates' }, { status: 403 });
    }

    const body = await request.json();
    const validation = certificateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      }, { status: 400 });
    }

    const { studentId, title, description, fileUrl } = validation.data;

    // Ensure student profile exists
    const targetStudent = await prisma.student.findUnique({ where: { id: studentId } });
    if (!targetStudent) {
      return NextResponse.json({ success: false, message: 'Recipient student profile not found' }, { status: 404 });
    }

    const certificate = await prisma.certificate.create({
      data: { studentId, title, description, fileUrl }
    });

    // Send notification
    await prisma.notification.create({
      data: {
        userId: targetStudent.userId,
        title: 'New Certificate Awarded! 🎓',
        message: `You have been awarded the certificate: "${title}". View it on your dashboard.`,
        type: 'ALERT'
      }
    });

    return NextResponse.json({ success: true, message: 'Certificate issued successfully', certificate }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/certificates]', error);
    return NextResponse.json({ success: false, message: 'Error issuing certificate' }, { status: 500 });
  }
}
