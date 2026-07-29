import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { validate, createIssueSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';

const issueLimiter = rateLimit({ interval: 60 * 60 * 1000, uniqueTokenPerInterval: 500 });

// GET /api/issues — List issues
export const GET = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    let where = {};

    // Volunteers see only their own issues; Coordinators see issues in their department
    if (dbUser.role === 'STUDENT') {
      if (!dbUser.student?.id) {
        return NextResponse.json({ issues: [] }, { status: 200 });
      }
      if (dbUser.student.isCoordinator) {
        where.student = { departmentId: dbUser.student.departmentId };
      } else {
        where.studentId = dbUser.student.id;
      }
    } else if (dbUser.role === 'FACULTY') {
      // Faculty can only see issues from their department
      const deptId = dbUser.faculty?.departmentId;
      if (!deptId) return NextResponse.json({ issues: [] }, { status: 200 });
      where.student = { departmentId: deptId };
    }
    // ADMIN: no filter — sees all issues

    const issues = await prisma.issue.findMany({
      where,
      include: {
        student: { include: { user: { select: { name: true, email: true } }, department: { select: { name: true, code: true } } } },
        resolvedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ issues }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching issues');
  }
});


// POST /api/issues — Report an issue (students only)
export const POST = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    if (!dbUser.student) {
      return NextResponse.json({ message: 'Only students can report issues' }, { status: 403 });
    }

    // Rate limit: 10 issues per hour per student
    const { success: withinLimit } = issueLimiter.check(10, `issue:${dbUser.id}`);
    if (!withinLimit) {
      return NextResponse.json({ message: 'Too many complaint submissions. Please wait before submitting another.' }, { status: 429 });
    }

    const body = await req.json();
    const { success, data: validated, error: validationError } = validate(createIssueSchema, body);
    if (!success) return NextResponse.json({ message: validationError }, { status: 400 });

    const { title, description } = validated;
    const issue = await prisma.issue.create({
      data: { studentId: dbUser.student.id, title, description }
    });

    return NextResponse.json({ message: 'Issue reported', issue }, { status: 201 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error reporting issue');
  }
});
