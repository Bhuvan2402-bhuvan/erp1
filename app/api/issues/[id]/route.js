import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';
import { updateIssueSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

// PATCH /api/issues/:id — Update issue status (resolve / close)
export async function PATCH(request, { params }) {
  try {
    const userContext = await getUser();
    if (!userContext || !userContext.dbUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { dbUser } = userContext;
    const { id } = params;

    // Access protection
    if (dbUser.isBlocked) {
      return NextResponse.json({ success: false, message: 'Account is blocked' }, { status: 403 });
    }
    if (dbUser.approvalStatus !== 'APPROVED' && dbUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Account pending approval' }, { status: 403 });
    }

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: { student: true }
    });

    if (!issue) {
      return NextResponse.json({ success: false, message: 'Issue not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateIssueSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      }, { status: 400 });
    }

    const { status } = validation.data;

    // Permission check:
    // Only Admins, Faculty, or Coordinators in same branch can resolve.
    // Regular students can only close their OWN issue.
    const isCoordinator = dbUser.student?.isCoordinator;
    const isOwner = dbUser.student?.id === issue.studentId;
    const isManager = dbUser.role === 'ADMIN' || dbUser.role === 'FACULTY' || (isCoordinator && dbUser.student.departmentId === issue.student.departmentId);

    if (status === 'RESOLVED' || status === 'IN_PROGRESS') {
      if (!isManager) {
        return NextResponse.json({ success: false, message: 'Forbidden: Only coordinator/faculty/admin can resolve complaints' }, { status: 403 });
      }
    } else if (status === 'CLOSED') {
      if (!isOwner && !isManager) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
    }

    const updated = await prisma.issue.update({
      where: { id },
      data: {
        status,
        ...(status === 'RESOLVED' ? { resolvedById: dbUser.id, resolvedAt: new Date() } : {})
      }
    });

    // Send notification to owner student
    await prisma.notification.create({
      data: {
        userId: issue.student.userId,
        title: `Complaint Status Updated: ${status} 📢`,
        message: `Your filed issue "${issue.title}" status has been set to ${status} by ${dbUser.name}.`,
        type: 'INFO'
      }
    });

    return NextResponse.json({ success: true, message: 'Complaint status updated successfully', issue: updated });
  } catch (error) {
    console.error('[PATCH /api/issues/:id]', error);
    return NextResponse.json({ success: false, message: 'Error updating complaint' }, { status: 500 });
  }
}
