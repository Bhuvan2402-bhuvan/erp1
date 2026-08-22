import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser, verifyAccess } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

/** Check if user can manage (edit/delete) this specific form */
async function checkFormAccess(dbUser, formId, requireManage = true) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { department: true, createdBy: { select: { id: true, name: true, email: true } } },
  });
  if (!form) return { allowed: false, form: null, reason: 'not_found' };
  if (form.status === 'ARCHIVED' && requireManage) return { allowed: false, form, reason: 'archived' };

  if (dbUser.role === 'ADMIN') return { allowed: true, form };

  if (dbUser.role === 'FACULTY') {
    const deptId = dbUser.faculty?.departmentId || dbUser.departmentId;
    if (form.departmentId !== deptId) return { allowed: false, form, reason: 'wrong_department' };
    return { allowed: true, form };
  }

  if (dbUser.role === 'STUDENT' && dbUser.student?.isCoordinator) {
    const deptId = dbUser.student?.departmentId;
    if (form.departmentId !== deptId) return { allowed: false, form, reason: 'wrong_department' };
    return { allowed: true, form };
  }

  return { allowed: false, form, reason: 'forbidden' };
}

// GET /api/forms/[formId] — Get form with fields
export async function GET(request, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const { formId } = params;
    const { allowed, form, reason } = await checkFormAccess(dbUser, formId, false);
    if (!form) return NextResponse.json({ message: 'Form not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ message: reason }, { status: 403 });

    const fields = await prisma.formField.findMany({
      where: { formId, isDeleted: false },
      orderBy: { sortOrder: 'asc' },
    });

    const responseCount = await prisma.formResponse.count({ where: { formId } });

    return NextResponse.json({ success: true, form: { ...form, fields }, responseCount });
  } catch (error) {
    console.error('[GET /api/forms/[formId]]', error);
    return NextResponse.json({ message: 'Error fetching form' }, { status: 500 });
  }
}

// PATCH /api/forms/[formId] — Update form metadata
export async function PATCH(request, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const { formId } = params;
    const { allowed, form, reason } = await checkFormAccess(dbUser, formId);
    if (!form) return NextResponse.json({ message: 'Form not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ message: reason }, { status: 403 });
    if (form.status === 'ARCHIVED') return NextResponse.json({ message: 'Cannot edit archived form' }, { status: 400 });

    const body = await request.json();
    const allowedFields = [
      'title', 'description', 'category', 'coverImageUrl', 'instructions',
      'visibility', 'startsAt', 'endsAt', 'allowMultipleSubmissions', 'allowEditing',
      'allowDraft', 'anonymous', 'maxResponses', 'requireAuth', 'confirmationMessage',
      'notifyOnSubmission', 'notifyOnReview',
    ];

    const data = {};
    for (const key of allowedFields) {
      if (key in body) {
        if (key === 'startsAt' || key === 'endsAt') {
          data[key] = body[key] ? new Date(body[key]) : null;
        } else {
          data[key] = body[key];
        }
      }
    }

    // Admin only: allow changing department
    if (dbUser.role === 'ADMIN' && body.departmentId) {
      data.departmentId = body.departmentId;
    }

    if (data.title !== undefined && !data.title?.trim()) {
      return NextResponse.json({ message: 'Title cannot be empty' }, { status: 400 });
    }

    const updated = await prisma.form.update({
      where: { id: formId },
      data,
      include: {
        department: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.formAuditLog.create({
      data: { formId, userId: dbUser.id, action: 'form_edited', metadata: { fields: Object.keys(data) } },
    }).catch(() => {});

    return NextResponse.json({ success: true, form: updated });
  } catch (error) {
    console.error('[PATCH /api/forms/[formId]]', error);
    return NextResponse.json({ message: 'Error updating form' }, { status: 500 });
  }
}

// DELETE /api/forms/[formId] — Archive form (soft delete)
export async function DELETE(request, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const { formId } = params;
    const { allowed, form, reason } = await checkFormAccess(dbUser, formId);
    if (!form) return NextResponse.json({ message: 'Form not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ message: reason }, { status: 403 });

    await prisma.form.update({ where: { id: formId }, data: { status: 'ARCHIVED' } });

    await prisma.formAuditLog.create({
      data: { formId, userId: dbUser.id, action: 'form_archived' },
    }).catch(() => {});

    return NextResponse.json({ success: true, message: 'Form archived' });
  } catch (error) {
    console.error('[DELETE /api/forms/[formId]]', error);
    return NextResponse.json({ message: 'Error archiving form' }, { status: 500 });
  }
}
