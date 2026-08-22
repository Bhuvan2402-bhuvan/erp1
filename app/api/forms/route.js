import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser, verifyAccess } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

/** Resolves the department ID the current user is authorized to manage forms for */
function getUserDeptId(dbUser) {
  if (dbUser.role === 'ADMIN') return null; // admin can access any dept
  if (dbUser.role === 'FACULTY') return dbUser.faculty?.departmentId || dbUser.departmentId;
  if (dbUser.role === 'STUDENT' && dbUser.student?.isCoordinator) return dbUser.student?.departmentId;
  return null;
}

/** Returns whether the user can manage forms (create/edit) */
function canManageForms(dbUser) {
  if (dbUser.role === 'ADMIN') return true;
  if (dbUser.role === 'FACULTY') return true;
  if (dbUser.role === 'STUDENT' && dbUser.student?.isCoordinator) return true;
  return false;
}

// GET /api/forms — List forms (role-filtered)
export async function GET(request) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const deptFilter = searchParams.get('departmentId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    let where = {};

    if (dbUser.role === 'ADMIN') {
      // Admin sees everything (or filtered by departmentId if supplied)
      if (deptFilter) where.departmentId = deptFilter;
      if (status) where.status = status;
    } else if (canManageForms(dbUser)) {
      // Faculty/Coordinator see their dept forms
      const deptId = getUserDeptId(dbUser);
      if (deptId) {
        where.departmentId = deptId;
      }
      if (status) where.status = status;
    } else {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          access: { include: { department: { select: { id: true, name: true, code: true } } } },
          _count: { select: { fields: { where: { isDeleted: false } }, responses: true } },
        },
      }),
      prisma.form.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      forms,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET /api/forms]', error);
    return NextResponse.json({ message: 'Error fetching forms' }, { status: 500 });
  }
}

// POST /api/forms — Create a new form
export async function POST(request) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    if (!canManageForms(dbUser)) {
      return NextResponse.json({ message: 'Forbidden: insufficient role' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, category, coverImageUrl, instructions, visibility,
      startsAt, endsAt, allowMultipleSubmissions, allowEditing, allowDraft,
      anonymous, maxResponses, requireAuth, confirmationMessage,
      notifyOnSubmission, notifyOnReview, selectedDepartmentIds, selectedUserIds } = body;

    if (!title?.trim()) return NextResponse.json({ message: 'Title is required' }, { status: 400 });

    // Determine department
    let departmentId = body.departmentId;
    if (dbUser.role !== 'ADMIN') {
      departmentId = getUserDeptId(dbUser) || dbUser.departmentId;
    }
    if (!departmentId) {
      const fallbackDept = await prisma.department.findFirst().catch(() => null);
      departmentId = fallbackDept?.id;
    }
    if (!departmentId) return NextResponse.json({ message: 'Department not found for user' }, { status: 400 });

    const form = await prisma.form.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        category: category || 'General',
        coverImageUrl,
        instructions: instructions?.trim(),
        departmentId,
        createdById: dbUser.id,
        visibility: visibility || 'DEPARTMENT_ONLY',
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        allowMultipleSubmissions: !!allowMultipleSubmissions,
        allowEditing: !!allowEditing,
        allowDraft: allowDraft !== false,
        anonymous: !!anonymous,
        maxResponses: maxResponses || null,
        requireAuth: requireAuth !== false,
        confirmationMessage: confirmationMessage || 'Thank you for your submission!',
        notifyOnSubmission: notifyOnSubmission !== false,
        notifyOnReview: notifyOnReview !== false,
        status: 'DRAFT',
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Handle FormAccess for selected departments or selected users
    if (visibility === 'SELECTED_DEPARTMENTS' && Array.isArray(selectedDepartmentIds) && selectedDepartmentIds.length > 0) {
      await prisma.formAccess.createMany({
        data: selectedDepartmentIds.map(dId => ({
          formId: form.id,
          departmentId: dId,
          accessType: 'view'
        }))
      }).catch(() => {});
    } else if (visibility === 'SELECTED_USERS' && Array.isArray(selectedUserIds) && selectedUserIds.length > 0) {
      await prisma.formAccess.createMany({
        data: selectedUserIds.map(uId => ({
          formId: form.id,
          userId: uId,
          accessType: 'view'
        }))
      }).catch(() => {});
    }

    // Audit log
    await prisma.formAuditLog.create({
      data: { formId: form.id, userId: dbUser.id, action: 'form_created', metadata: { title: form.title } },
    }).catch(() => {});

    return NextResponse.json({ success: true, form }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/forms]', error);
    return NextResponse.json({ message: 'Error creating form' }, { status: 500 });
  }
}

