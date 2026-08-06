import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { validate, createEventSchema } from '@/lib/validations';

// GET /api/events — List events (all authenticated users)
export const GET = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 100);
    const skip = (page - 1) * limit;

    const where = {};
    const validStatuses = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];
    const validTypes = ['ACTIVITY', 'CAMP', 'WORKSHOP', 'RALLY', 'AWARENESS'];

    if (status) {
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
      }
      where.status = status;
    }
    if (type) {
      if (!validTypes.includes(type)) {
        return NextResponse.json({ message: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 });
      }
      where.type = type;
    }

    // Automatically mark past events as COMPLETED if currently UPCOMING or ONGOING
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
        take: limit,
        include: {
          _count: { select: { registrations: true, attendances: true, photos: true } },
          ...(dbUser.student ? {
            registrations: {
              where: { studentId: dbUser.student.id }
            }
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
      events: formattedEvents,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching events');
  }
});

// POST /api/events — Create event (Admin, Faculty, Coordinator)
export const POST = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;

    // Only Admin, Faculty, or Coordinators can create events
    const isCoordinator = dbUser.student?.isCoordinator;
    if (dbUser.role === 'STUDENT' && !isCoordinator) {
      return NextResponse.json({ message: 'Only coordinators can create events' }, { status: 403 });
    }

    const body = await req.json();
    const { success, data: validated, error: validationError } = validate(createEventSchema, body);

    if (!success) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const { title, description, date, endDate, location, type } = validated;
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

    return NextResponse.json({ message: 'Event created', event }, { status: 201 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error creating event');
  }
});
