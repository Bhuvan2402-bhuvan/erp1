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

// POST /api/forms/[formId]/publish
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
    if (form.status === 'ARCHIVED') return NextResponse.json({ message: 'Cannot publish archived form' }, { status: 400 });

    // Verify form has at least one field
    const fieldCount = await prisma.formField.count({ where: { formId, isDeleted: false } });
    if (fieldCount === 0) return NextResponse.json({ message: 'Form must have at least one field before publishing' }, { status: 400 });

    const updated = await prisma.form.update({
      where: { id: formId },
      data: {
        status: 'PUBLISHED',
        startsAt: form.startsAt || new Date(),
      },
    });

    await prisma.formAuditLog.create({
      data: { formId, userId: dbUser.id, action: 'form_published' },
    }).catch(() => {});

    // Notify eligible students (fire and forget)
    notifyEligibleStudents(form, dbUser).catch(() => {});

    return NextResponse.json({ success: true, form: updated });
  } catch (error) {
    console.error('[POST /api/forms/[formId]/publish]', error);
    return NextResponse.json({ message: 'Error publishing form' }, { status: 500 });
  }
}

async function notifyEligibleStudents(form, creator) {
  try {
    let studentWhere = { approvalStatus: 'APPROVED', isBlocked: false };
    if (form.visibility === 'DEPARTMENT_ONLY') {
      studentWhere.student = { departmentId: form.departmentId };
    }
    const students = await prisma.user.findMany({
      where: { ...studentWhere, role: 'STUDENT' },
      select: { id: true },
    });

    if (students.length === 0) return;

    await prisma.notification.createMany({
      data: students.map(s => ({
        userId: s.id,
        title: 'New Form Available',
        message: `"${form.title}" is now open for submissions.`,
        type: 'INFO',
      })),
      skipDuplicates: true,
    });
  } catch (e) {
    console.error('[notifyEligibleStudents]', e);
  }
}
