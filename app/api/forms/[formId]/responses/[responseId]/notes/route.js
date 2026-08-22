import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser, verifyAccess } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// POST /api/forms/[formId]/responses/[responseId]/notes
export async function POST(request, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    // Only faculty/admin/coordinator can add notes
    const canNote =
      dbUser.role === 'ADMIN' ||
      dbUser.role === 'FACULTY' ||
      (dbUser.role === 'STUDENT' && dbUser.student?.isCoordinator);
    if (!canNote) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { formId, responseId } = params;

    // Verify response belongs to this form and user has dept access
    const response = await prisma.formResponse.findFirst({
      where: { id: responseId, formId },
      include: { form: true },
    });
    if (!response) return NextResponse.json({ message: 'Response not found' }, { status: 404 });

    // Dept check
    if (dbUser.role !== 'ADMIN') {
      const deptId = dbUser.role === 'FACULTY'
        ? (dbUser.faculty?.departmentId || dbUser.departmentId)
        : dbUser.student?.departmentId;
      if (response.form.departmentId !== deptId) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { note } = await request.json();
    if (!note?.trim()) return NextResponse.json({ message: 'Note content is required' }, { status: 400 });

    const created = await prisma.formResponseNote.create({
      data: { responseId, authorId: dbUser.id, note: note.trim() },
      include: { author: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, note: created }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/forms/[formId]/responses/[responseId]/notes]', error);
    return NextResponse.json({ message: 'Error adding note' }, { status: 500 });
  }
}

// GET /api/forms/[formId]/responses/[responseId]/notes
export async function GET(request, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;

    const { formId, responseId } = params;
    const canNote = dbUser.role === 'ADMIN' || dbUser.role === 'FACULTY' || (dbUser.role === 'STUDENT' && dbUser.student?.isCoordinator);
    if (!canNote) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const notes = await prisma.formResponseNote.findMany({
      where: { responseId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, notes });
  } catch (error) {
    console.error('[GET notes]', error);
    return NextResponse.json({ message: 'Error fetching notes' }, { status: 500 });
  }
}
