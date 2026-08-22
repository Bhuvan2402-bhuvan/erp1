import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser, verifyAccess } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

async function checkManageAccess(dbUser, formId) {
  const form = await prisma.form.findUnique({ where: { id: formId } });
  if (!form) return { allowed: false, form: null };
  if (dbUser.role === 'ADMIN') return { allowed: true, form };
  if (dbUser.role === 'FACULTY') {
    const deptId = dbUser.faculty?.departmentId || dbUser.departmentId;
    return { allowed: form.departmentId === deptId, form };
  }
  if (dbUser.role === 'STUDENT' && dbUser.student?.isCoordinator) {
    return { allowed: form.departmentId === dbUser.student?.departmentId, form };
  }
  return { allowed: false, form };
}

// PATCH /api/forms/[formId]/fields/[fieldId] — Update a field
export async function PATCH(request, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const { formId, fieldId } = params;
    const { allowed, form } = await checkManageAccess(dbUser, formId);
    if (!form) return NextResponse.json({ message: 'Form not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const field = await prisma.formField.findFirst({ where: { id: fieldId, formId } });
    if (!field) return NextResponse.json({ message: 'Field not found' }, { status: 404 });

    const body = await request.json();
    const allowedKeys = ['label', 'description', 'placeholder', 'required', 'defaultValue',
      'helpText', 'options', 'validationRules', 'conditionalRules', 'sortOrder', 'fieldType'];

    const data = {};
    for (const key of allowedKeys) {
      if (key in body) data[key] = body[key];
    }

    const updated = await prisma.formField.update({ where: { id: fieldId }, data });
    return NextResponse.json({ success: true, field: updated });
  } catch (error) {
    console.error('[PATCH /api/forms/[formId]/fields/[fieldId]]', error);
    return NextResponse.json({ message: 'Error updating field' }, { status: 500 });
  }
}

// DELETE /api/forms/[formId]/fields/[fieldId] — Soft-delete a field
export async function DELETE(request, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const { formId, fieldId } = params;
    const { allowed, form } = await checkManageAccess(dbUser, formId);
    if (!form) return NextResponse.json({ message: 'Form not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const field = await prisma.formField.findFirst({ where: { id: fieldId, formId } });
    if (!field) return NextResponse.json({ message: 'Field not found' }, { status: 404 });

    // Soft delete — preserve answers for existing responses
    await prisma.formField.update({ where: { id: fieldId }, data: { isDeleted: true } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/forms/[formId]/fields/[fieldId]]', error);
    return NextResponse.json({ message: 'Error deleting field' }, { status: 500 });
  }
}
