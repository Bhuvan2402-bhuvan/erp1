export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';

// PATCH /api/villages/reports/[reportId] — Admin reviews or Faculty edits draft
export const PATCH = withAuth(async (req, { params, user }) => {
  try {
    const { reportId } = await params;
    const { dbUser } = user;

    const existing = await prisma.villageWeeklyReport.findUnique({ where: { id: reportId } });
    if (!existing) return NextResponse.json({ message: 'Report not found' }, { status: 404 });

    const body = await req.json();

    // Admin can review any report
    if (dbUser.role === 'ADMIN') {
      const updateData = {};
      if (body.adminRemarks !== undefined) updateData.adminRemarks = body.adminRemarks;
      if (body.status !== undefined) updateData.status = body.status;

      const report = await prisma.villageWeeklyReport.update({
        where: { id: reportId },
        data: updateData,
        include: { submittedBy: { select: { name: true, email: true } } }
      });

      return NextResponse.json({ message: 'Report reviewed', report }, { status: 200 });
    }

    // Faculty can only edit their own drafts
    if (dbUser.role === 'FACULTY') {
      if (existing.submittedById !== dbUser.id) {
        return NextResponse.json({ message: 'Not your report' }, { status: 403 });
      }
      if (existing.status !== 'DRAFT') {
        return NextResponse.json({ message: 'Only drafts can be edited' }, { status: 400 });
      }

      const updateData = {};
      if (body.activitiesDone !== undefined) updateData.activitiesDone = body.activitiesDone;
      if (body.volunteersInvolved !== undefined) updateData.volunteersInvolved = parseInt(body.volunteersInvolved) || 0;
      if (body.challengesFaced !== undefined) updateData.challengesFaced = body.challengesFaced;
      if (body.nextWeekPlan !== undefined) updateData.nextWeekPlan = body.nextWeekPlan;
      if (body.weekStartDate !== undefined) updateData.weekStartDate = new Date(body.weekStartDate);
      if (body.weekEndDate !== undefined) updateData.weekEndDate = new Date(body.weekEndDate);
      if (body.status !== undefined) updateData.status = body.status;

      const report = await prisma.villageWeeklyReport.update({
        where: { id: reportId },
        data: updateData,
        include: { submittedBy: { select: { name: true, email: true } } }
      });

      return NextResponse.json({ message: 'Report updated', report }, { status: 200 });
    }

    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error updating report');
  }
});

// DELETE /api/villages/reports/[reportId] — Admin or owner (draft only) can delete
export const DELETE = withAuth(async (req, { params, user }) => {
  try {
    const { reportId } = await params;
    const { dbUser } = user;

    const existing = await prisma.villageWeeklyReport.findUnique({ where: { id: reportId } });
    if (!existing) return NextResponse.json({ message: 'Report not found' }, { status: 404 });

    if (dbUser.role === 'ADMIN') {
      await prisma.villageWeeklyReport.delete({ where: { id: reportId } });
      return NextResponse.json({ message: 'Report deleted' }, { status: 200 });
    }

    if (existing.submittedById === dbUser.id && existing.status === 'DRAFT') {
      await prisma.villageWeeklyReport.delete({ where: { id: reportId } });
      return NextResponse.json({ message: 'Draft deleted' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error deleting report');
  }
});
