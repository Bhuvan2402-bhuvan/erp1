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

// GET /api/forms/[formId]/fields — List fields for a form
export async function GET(request, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const { formId } = params;
    const { allowed, form } = await checkManageAccess(dbUser, formId);
    if (!form) return NextResponse.json({ message: 'Form not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const fields = await prisma.formField.findMany({
      where: { formId, isDeleted: false },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, fields });
  } catch (error) {
    console.error('[GET /api/forms/[formId]/fields]', error);
    return NextResponse.json({ message: 'Error fetching fields' }, { status: 500 });
  }
}

// POST /api/forms/[formId]/fields — Add a field
export async function POST(request, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const { formId } = params;
    const { allowed, form } = await checkManageAccess(dbUser, formId);
    if (!form) return NextResponse.json({ message: 'Form not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    if (form.status === 'ARCHIVED') return NextResponse.json({ message: 'Cannot modify archived form' }, { status: 400 });

    const body = await request.json();
    const { fieldType, label, description, placeholder, required, defaultValue,
      helpText, options, validationRules, conditionalRules, sortOrder } = body;

    if (!fieldType) return NextResponse.json({ message: 'fieldType is required' }, { status: 400 });
    if (!label?.trim()) return NextResponse.json({ message: 'label is required' }, { status: 400 });

    // Get max sort order
    const maxField = await prisma.formField.findFirst({
      where: { formId, isDeleted: false },
      orderBy: { sortOrder: 'desc' },
    });
    const nextOrder = sortOrder ?? (maxField ? maxField.sortOrder + 1 : 0);

    const field = await prisma.formField.create({
      data: {
        formId,
        fieldType,
        label: label.trim(),
        description: description?.trim(),
        placeholder: placeholder?.trim(),
        required: !!required,
        defaultValue,
        helpText: helpText?.trim(),
        options: options || null,
        validationRules: validationRules || null,
        conditionalRules: conditionalRules || null,
        sortOrder: nextOrder,
      },
    });

    return NextResponse.json({ success: true, field }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/forms/[formId]/fields]', error);
    return NextResponse.json({ message: 'Error creating field' }, { status: 500 });
  }
}

// PUT /api/forms/[formId]/fields — Bulk reorder fields
export async function PUT(request, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;

    const { formId } = params;
    const { allowed, form } = await checkManageAccess(dbUser, formId);
    if (!form) return NextResponse.json({ message: 'Form not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { orderedIds } = await request.json();
    if (!Array.isArray(orderedIds)) return NextResponse.json({ message: 'orderedIds must be an array' }, { status: 400 });

    await Promise.all(
      orderedIds.map((id, index) =>
        prisma.formField.updateMany({
          where: { id, formId },
          data: { sortOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PUT /api/forms/[formId]/fields]', error);
    return NextResponse.json({ message: 'Error reordering fields' }, { status: 500 });
  }
}
