import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser, verifyAccess } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

async function getResponseAndCheckAccess(dbUser, formId, responseId) {
  const response = await prisma.formResponse.findFirst({
    where: { id: responseId, formId },
    include: {
      form: { include: { department: true } },
      submittedBy: {
        select: {
          id: true, name: true, email: true,
          student: { select: { rollNo: true, year: true, section: true, department: { select: { name: true, code: true } } } },
        },
      },
      answers: { include: { field: true } },
      notes: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!response) return { allowed: false, response: null, reason: 'not_found' };

  if (dbUser.role === 'ADMIN') return { allowed: true, response, isOwner: false, canReview: true };
  if (dbUser.role === 'FACULTY') {
    const deptId = dbUser.faculty?.departmentId || dbUser.departmentId;
    if (response.form.departmentId !== deptId) return { allowed: false, response, reason: 'wrong_department' };
    return { allowed: true, response, isOwner: false, canReview: true };
  }
  if (dbUser.role === 'STUDENT' && dbUser.student?.isCoordinator) {
    if (response.form.departmentId !== dbUser.student?.departmentId) return { allowed: false, response, reason: 'wrong_department' };
    return { allowed: true, response, isOwner: false, canReview: true };
  }
  // Student: only their own
  if (response.submittedById === dbUser.id) return { allowed: true, response, isOwner: true, canReview: false };
  return { allowed: false, response: null, reason: 'forbidden' };
}

// GET /api/forms/[formId]/responses/[responseId]
export async function GET(request, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const { formId, responseId } = params;
    const { allowed, response, reason } = await getResponseAndCheckAccess(dbUser, formId, responseId);
    if (!response) return NextResponse.json({ message: 'Response not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ message: reason || 'Forbidden' }, { status: 403 });

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error('[GET /api/forms/[formId]/responses/[responseId]]', error);
    return NextResponse.json({ message: 'Error fetching response' }, { status: 500 });
  }
}

// PATCH /api/forms/[formId]/responses/[responseId] — Review (faculty) or edit (student)
export async function PATCH(request, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const { formId, responseId } = params;
    const { allowed, response, isOwner, canReview, reason } = await getResponseAndCheckAccess(dbUser, formId, responseId);
    if (!response) return NextResponse.json({ message: 'Response not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ message: reason || 'Forbidden' }, { status: 403 });

    const body = await request.json();

    if (canReview) {
      // Faculty/Coordinator reviewing
      const { status } = body;
      const allowedStatuses = ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUBMITTED'];
      if (!allowedStatuses.includes(status)) return NextResponse.json({ message: 'Invalid status' }, { status: 400 });

      const updated = await prisma.formResponse.update({
        where: { id: responseId },
        data: { status },
      });

      const actionMap = { APPROVED: 'response_approved', REJECTED: 'response_rejected', UNDER_REVIEW: 'response_reviewed' };
      const action = actionMap[status] || 'response_reviewed';
      await prisma.formAuditLog.create({
        data: { formId, userId: dbUser.id, action, metadata: { responseId } },
      }).catch(() => {});

      // Notify student if enabled
      if (response.form.notifyOnReview && (status === 'APPROVED' || status === 'REJECTED')) {
        await prisma.notification.create({
          data: {
            userId: response.submittedById,
            title: `Submission ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
            message: `Your submission for "${response.form.title}" has been ${status.toLowerCase()}.`,
            type: status === 'APPROVED' ? 'INFO' : 'WARNING',
          },
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, response: updated });
    } else if (isOwner) {
      // Student editing their own draft
      if (!response.form.allowEditing && response.status === 'SUBMITTED') {
        return NextResponse.json({ message: 'Editing after submission is not allowed' }, { status: 400 });
      }
      const { answers, isDraft } = body;
      if (answers) {
        for (const answer of answers) {
          if (!answer.fieldId) continue;
          await prisma.formAnswer.upsert({
            where: { responseId_fieldId: { responseId, fieldId: answer.fieldId } },
            create: { responseId, fieldId: answer.fieldId, value: answer.value, values: answer.values, fileUrl: answer.fileUrl },
            update: { value: answer.value, values: answer.values, fileUrl: answer.fileUrl },
          });
        }
      }
      const updated = await prisma.formResponse.update({
        where: { id: responseId },
        data: { status: isDraft ? 'DRAFT' : 'SUBMITTED', submittedAt: isDraft ? undefined : new Date() },
      });
      return NextResponse.json({ success: true, response: updated });
    }

    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  } catch (error) {
    console.error('[PATCH /api/forms/[formId]/responses/[responseId]]', error);
    return NextResponse.json({ message: 'Error updating response' }, { status: 500 });
  }
}
