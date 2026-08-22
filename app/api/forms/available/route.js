import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser, verifyAccess } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/forms/available — Student-facing published forms they can fill
export async function GET(request) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    const userRole = dbUser.role; // ADMIN | FACULTY | STUDENT
    const isCoordinator = userRole === 'STUDENT' && !!dbUser.student?.isCoordinator;
    const userDeptId = dbUser.faculty?.departmentId || dbUser.student?.departmentId || dbUser.departmentId;

    // Auto-close forms past deadline
    await prisma.form.updateMany({
      where: { status: 'PUBLISHED', endsAt: { lt: new Date() } },
      data: { status: 'CLOSED' },
    }).catch(() => {});

    // Build role & department eligibility filter
    const visibilityFilter = [];

    if (userRole === 'ADMIN') {
      // Admin can see/access any published form
      visibilityFilter.push(
        { visibility: 'ALL_VOLUNTEERS' },
        { visibility: 'ADMIN_ONLY' },
        { visibility: 'FACULTY_ONLY' },
        { visibility: 'COORDINATORS_ONLY' },
        { visibility: 'INTERNAL_DEPT' },
        { visibility: 'DEPARTMENT_ONLY' },
        { visibility: 'SELECTED_DEPARTMENTS' },
        { visibility: 'SELECTED_USERS' }
      );
    } else {
      // 1. All Volunteers forms (global)
      visibilityFilter.push({ visibility: 'ALL_VOLUNTEERS' });

      // 2. Department-wide forms
      if (userDeptId) {
        visibilityFilter.push({ visibility: 'DEPARTMENT_ONLY', departmentId: userDeptId });
        visibilityFilter.push({
          visibility: 'SELECTED_DEPARTMENTS',
          access: { some: { departmentId: userDeptId } },
        });
      }

      // 3. Faculty-only forms
      if (userRole === 'FACULTY') {
        visibilityFilter.push({ visibility: 'FACULTY_ONLY' });
        if (userDeptId) {
          visibilityFilter.push({ visibility: 'INTERNAL_DEPT', departmentId: userDeptId });
        }
      }

      // 4. Student Coordinator forms
      if (isCoordinator) {
        visibilityFilter.push({ visibility: 'COORDINATORS_ONLY' });
        if (userDeptId) {
          visibilityFilter.push({ visibility: 'INTERNAL_DEPT', departmentId: userDeptId });
        }
      }

      // 5. Explicitly targeted user forms
      visibilityFilter.push({
        visibility: 'SELECTED_USERS',
        access: { some: { userId: dbUser.id } },
      });
    }

    const baseWhere = {
      status: 'PUBLISHED',
      OR: visibilityFilter,
    };

    if (search) {
      baseWhere.AND = [{ OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]}];
    }

    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where: baseWhere,
        orderBy: [{ endsAt: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, name: true } },
          _count: { select: { fields: { where: { isDeleted: false } } } },
          // Include the current user's response if any
          responses: { where: { submittedById: dbUser.id }, select: { id: true, status: true } },
        },
      }),
      prisma.form.count({ where: baseWhere }),
    ]);

    const enriched = forms.map(f => {
      const myResponse = f.responses?.[0] || null;
      const { responses, ...rest } = f;
      return {
        ...rest,
        myResponse,
        fieldCount: f._count.fields,
        estimatedMinutes: Math.max(1, Math.ceil(f._count.fields * 0.5)),
      };
    });

    return NextResponse.json({
      success: true,
      forms: enriched,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET /api/forms/available]', error);
    return NextResponse.json({ message: 'Error fetching available forms' }, { status: 500 });
  }
}
