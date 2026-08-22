import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';
import { createEventSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

// GET /api/events — List events with page/limit/status/type filters
export async function GET(request) {
  try {
    const userContext = await getUser();
    if (!userContext || !userContext.dbUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { dbUser } = userContext;

    // Access protection
    if (dbUser.isBlocked) {
      return NextResponse.json({ success: false, message: 'Account is blocked' }, { status: 403 });
    }
    if (dbUser.approvalStatus !== 'APPROVED' && dbUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Account pending approval' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';

    const pageNum = parseInt(page);
    const limitNum = Math.min(Math.max(parseInt(limit), 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    // Auto-update status of expired events
    await prisma.event.updateMany({
      where: {
        status: { in: ['UPCOMING', 'ONGOING'] },
        date: { lt: new Date() }
      },
      data: { status: 'COMPLETED' }
    });

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
        include: {
          _count: { select: { registrations: true, attendances: true, photos: true } },
          ...(dbUser.student ? {
            registrations: { where: { studentId: dbUser.student.id } }
          } : {})
        }
      }),
      prisma.event.count({ where })
    ]);

    const formattedEvents = events.map(e => {
      const isRegistered = e.registrations ? e.registrations.length > 0 : false;
      const { registrations, ...rest } = e;
      return { ...rest, isRegistered };
    });

    return NextResponse.json({
      success: true,
      events: formattedEvents,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('[GET /api/events]', error);
    return NextResponse.json({ success: false, message: 'Error fetching events' }, { status: 500 });
  }
}

// POST /api/events — Create Event (Admins/Faculty/Coordinators)
export async function POST(request) {
  try {
    const userContext = await getUser();
    if (!userContext || !userContext.dbUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { dbUser } = userContext;

    // Access protection
    if (dbUser.isBlocked) {
      return NextResponse.json({ success: false, message: 'Account is blocked' }, { status: 403 });
    }
    if (dbUser.approvalStatus !== 'APPROVED' && dbUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Account pending approval' }, { status: 403 });
    }

    const isCoordinator = dbUser.student?.isCoordinator;
    if (dbUser.role === 'STUDENT' && !isCoordinator) {
      return NextResponse.json({ success: false, message: 'Only coordinators can create events' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createEventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      }, { status: 400 });
    }

    const { title, description, date, endDate, location, type } = validation.data;
    const qrCode = body.qrCode || `NSS-EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        location,
        type: type || 'ACTIVITY',
        qrCode,
        createdById: dbUser.id
      }
    });

    return NextResponse.json({ success: true, message: 'Event created successfully', event }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/events]', error);
    return NextResponse.json({ success: false, message: 'Error creating event' }, { status: 500 });
  }
}
