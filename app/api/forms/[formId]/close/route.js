import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser, verifyAccess } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// POST /api/forms/[formId]/close
export async function POST(request, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const { formId } = params;
    const form = await prisma.form.findUnique({ where: { id: formId } });
    if (!form) return NextResponse.json({ message: 'Form not found' }, { status: 404 });

    // Authorization check
    let allowed = false;
    if (dbUser.role === 'ADMIN') allowed = true;
    else if (dbUser.role === 'FACULTY') {
      const deptId = dbUser.faculty?.departmentId || dbUser.departmentId;
      allowed = form.departmentId === deptId;
    } else if (dbUser.role === 'STUDENT' && dbUser.student?.isCoordinator) {
      allowed = form.departmentId === dbUser.student?.departmentId;
    }

    if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    if (form.status !== 'PUBLISHED') return NextResponse.json({ message: 'Only published forms can be closed' }, { status: 400 });

    const updated = await prisma.form.update({
      where: { id: formId },
      data: { status: 'CLOSED' },
    });

    await prisma.formAuditLog.create({
      data: { formId, userId: dbUser.id, action: 'form_closed' },
    }).catch(() => {});

    return NextResponse.json({ success: true, form: updated });
  } catch (error) {
    console.error('[POST /api/forms/[formId]/close]', error);
    return NextResponse.json({ message: 'Error closing form' }, { status: 500 });
  }
}
