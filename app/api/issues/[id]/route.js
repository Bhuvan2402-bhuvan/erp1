import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { validate, updateIssueSchema } from '@/lib/validations';

// PUT /api/issues/[id] — Update issue status (Admin, Faculty, or Coordinator resolves)
export const PUT = withAuth(async (req, { params, user }) => {
  try {
    const { dbUser } = user;
    if (dbUser.role === 'STUDENT' && !dbUser.student?.isCoordinator) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { success, data, error: validationError } = validate(updateIssueSchema, body);
    if (!success) return NextResponse.json({ message: validationError }, { status: 400 });

    const { status } = data;
    const updateData = { status };

    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolvedById = dbUser.id;
      updateData.resolvedAt = new Date();
    }

    const issue = await prisma.issue.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json({ message: 'Issue updated', issue }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error updating issue');
  }
});
