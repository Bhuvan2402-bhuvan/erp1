import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { rateLimit } from '@/lib/rate-limit';

const backupLimiter = rateLimit({ interval: 15 * 60 * 1000, uniqueTokenPerInterval: 200 });

export const GET = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    if (dbUser.role !== 'ADMIN' && dbUser.role !== 'FACULTY') {
      return NextResponse.json({ message: 'Forbidden. Only faculty and admins can export system backup records.' }, { status: 403 });
    }

    // Rate limit: 5 backup exports per 15 minutes per user
    const { success: withinLimit } = backupLimiter.check(5, `backup:${dbUser.id}`);
    if (!withinLimit) {
      return NextResponse.json({ message: 'Backup request limit reached. Please wait before generating another backup.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') || '1000'), 2000);

    const validTypes = ['all', 'finance', 'documentation', 'events', 'attendance'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ message: `Invalid backup type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      const parsedStart = new Date(startDate);
      if (!isNaN(parsedStart.getTime())) dateFilter.gte = parsedStart;
    }
    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (!isNaN(parsedEnd.getTime())) dateFilter.lte = parsedEnd;
    }
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const backupData = {
      exportedAt: new Date().toISOString(),
      exportedBy: {
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role
      },
      filters: {
        type,
        startDate: startDate || null,
        endDate: endDate || null,
        limit
      }
    };

    if (type === 'all' || type === 'finance') {
      backupData.finance = await prisma.financeRecord.findMany({
        where: hasDateFilter ? { createdAt: dateFilter } : undefined,
        include: { createdBy: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    }

    if (type === 'all' || type === 'documentation') {
      backupData.documentations = await prisma.documentation.findMany({
        where: hasDateFilter ? { createdAt: dateFilter } : undefined,
        include: { uploadedBy: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    }

    if (type === 'all' || type === 'events') {
      backupData.eventReports = await prisma.event.findMany({
        where: hasDateFilter ? { date: dateFilter } : undefined,
        include: {
          createdBy: { select: { name: true, email: true } },
          _count: { select: { registrations: true, attendances: true, photos: true } }
        },
        orderBy: { date: 'desc' },
        take: limit
      });
    }

    if (type === 'all' || type === 'attendance') {
      backupData.studentAttendance = await prisma.eventAttendance.findMany({
        where: hasDateFilter ? { createdAt: dateFilter } : undefined,
        include: {
          event: { select: { title: true, date: true, type: true } },
          student: {
            include: {
              user: { select: { name: true, email: true } },
              department: { select: { code: true, name: true } }
            }
          },
          markedBy: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    }

    return NextResponse.json({ backup: backupData }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error generating system data backup');
  }
});
