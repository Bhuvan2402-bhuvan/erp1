import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';
import { issueSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

// GET /api/issues — List issues (scoped)
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
    const status = searchParams.get('status');

    const where = {};
    if (status) where.status = status;

    if (dbUser.role === 'STUDENT') {
      if (!dbUser.student) {
        return NextResponse.json({ success: false, message: 'Student profile not active' }, { status: 400 });
      }
      // Coordinators see all issues in branch, regular student only sees their own
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

    const issues = await prisma.issue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            department: { select: { name: true, code: true } }
          }
        },
        resolvedBy: { select: { name: true } }
      }
    });

    return NextResponse.json({ success: true, issues });
  } catch (error) {
    console.error('[GET /api/issues]', error);
    return NextResponse.json({ success: false, message: 'Error fetching issues' }, { status: 500 });
  }
}

// POST /api/issues — File a new issue (Students only)
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

    if (!dbUser.student) {
      return NextResponse.json({ success: false, message: 'Only registered students can file complaints' }, { status: 400 });
    }

    const body = await request.json();
    const validation = issueSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      }, { status: 400 });
    }

    const { title, description } = validation.data;

    const issue = await prisma.issue.create({
      data: {
        studentId: dbUser.student.id,
        title,
        description,
        status: 'OPEN'
      }
    });

    return NextResponse.json({ success: true, message: 'Complaint registered successfully', issue }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/issues]', error);
    return NextResponse.json({ success: false, message: 'Error filing complaint' }, { status: 500 });
  }
}
