import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';

export const GET = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    const isCallerAdmin = dbUser.role === 'ADMIN';
    const isCallerFaculty = dbUser.role === 'FACULTY';
    const isCallerCoordinator = dbUser.role === 'STUDENT' && dbUser.student?.isCoordinator;

    if (!isCallerAdmin && !isCallerFaculty && !isCallerCoordinator) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let departmentId = searchParams.get('departmentId');
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);
    const skip = (page - 1) * limit;

    // Coordinators and Faculty can only fetch students from their own department
    if (isCallerCoordinator || isCallerFaculty) {
      const userDeptId = isCallerFaculty ? dbUser.faculty?.departmentId : dbUser.student?.departmentId;
      if (!userDeptId) {
        return NextResponse.json({ message: 'No department assigned to your profile' }, { status: 403 });
      }
      if (departmentId && departmentId !== userDeptId) {
        const errorMsg = isCallerFaculty
          ? 'Faculty can only fetch students from their own branch'
          : 'Coordinators can only fetch students from their own branch';
        return NextResponse.json({ message: errorMsg }, { status: 403 });
      }
      departmentId = userDeptId;
    }

    const where = departmentId ? { departmentId } : {};

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, approvalStatus: true, isBlocked: true } },
          department: { select: { name: true, code: true } },
          mentor: { select: { id: true, userId: true, user: { select: { name: true } } } }
        },
        skip,
        take: limit,
        orderBy: { rollNo: 'asc' }
      }),
      prisma.student.count({ where })
    ]);

    return NextResponse.json({
      students,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching students');
  }
});
