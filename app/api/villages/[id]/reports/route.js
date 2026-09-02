export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';

// GET /api/villages/[id]/reports — List weekly reports for a village
export const GET = withAuth(async (req, { params, user }) => {
  try {
    const { id } = await params;
    const { dbUser } = user;

    const village = await prisma.adoptedVillage.findUnique({ where: { id } });
    if (!village) return NextResponse.json({ message: 'Village not found' }, { status: 404 });

    // Faculty can only see reports for their assigned villages
    if (dbUser.role === 'FACULTY' && dbUser.faculty && village.facultyId !== dbUser.faculty.id) {
      return NextResponse.json({ message: 'Not your assigned village' }, { status: 403 });
    }

    const reports = await prisma.villageWeeklyReport.findMany({
      where: { villageId: id },
      include: {
        submittedBy: { select: { name: true, email: true } }
      },
      orderBy: { weekStartDate: 'desc' }
    });

    return NextResponse.json({ reports }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching village reports');
  }
});

// POST /api/villages/[id]/reports — Faculty submits a weekly report
export const POST = withAuth(async (req, { params, user }) => {
  try {
    const { id } = await params;
    const { dbUser } = user;

    if (dbUser.role !== 'FACULTY' && dbUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Faculty or Admin only' }, { status: 403 });
    }

    const village = await prisma.adoptedVillage.findUnique({ where: { id } });
    if (!village) return NextResponse.json({ message: 'Village not found' }, { status: 404 });

    // Faculty can only submit reports for their own villages
    if (dbUser.role === 'FACULTY' && dbUser.faculty && village.facultyId !== dbUser.faculty.id) {
      return NextResponse.json({ message: 'Not your assigned village' }, { status: 403 });
    }

    const body = await req.json();
    const { weekStartDate, weekEndDate, activitiesDone, volunteersInvolved, challengesFaced, nextWeekPlan, status } = body;

    if (!weekStartDate || !weekEndDate || !activitiesDone) {
      return NextResponse.json(
        { message: 'Week start date, end date, and activities done are required' },
        { status: 400 }
      );
    }

    const report = await prisma.villageWeeklyReport.create({
      data: {
        villageId: id,
        submittedById: dbUser.id,
        weekStartDate: new Date(weekStartDate),
        weekEndDate: new Date(weekEndDate),
        activitiesDone,
        volunteersInvolved: parseInt(volunteersInvolved) || 0,
        challengesFaced: challengesFaced || null,
        nextWeekPlan: nextWeekPlan || null,
        status: status || 'SUBMITTED'
      },
      include: {
        submittedBy: { select: { name: true, email: true } }
      }
    });

    return NextResponse.json({ message: 'Report submitted', report }, { status: 201 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error submitting report');
  }
});
