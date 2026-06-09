import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { validate, updateEventSchema } from '@/lib/validations';

// GET /api/events/[id] — Event details
export const GET = withAuth(async (req, { params, user }) => {
  try {
    const { id } = params;
    const { dbUser } = user;
    const isManager = dbUser.role === 'ADMIN' ||
                      dbUser.role === 'FACULTY' ||
                      dbUser.student?.isCoordinator === true;

    const include = {
      createdBy: { select: { name: true, role: true } },
      photos: {
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      }
    };

    if (isManager) {
      include.registrations = {
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true } },
              department: { select: { name: true, code: true } }
            }
          }
        }
      };
      include.attendances = {
        include: {
          student: {
            include: {
              user: { select: { name: true } }
            }
          },
          markedBy: { select: { name: true } }
        }
      };
    }

    const event = await prisma.event.findUnique({ where: { id }, include });
    if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });

    return NextResponse.json({ event }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching event');
  }
});

// PUT /api/events/[id] — Update event
export const PUT = withAuth(async (req, { params, user }) => {
  try {
    const { dbUser } = user;
    if (dbUser.role === 'STUDENT' && !dbUser.student?.isCoordinator) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const eventToUpdate = await prisma.event.findUnique({ where: { id } });
    if (!eventToUpdate) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const isCreator = eventToUpdate.createdById === dbUser.id;
    const isAdmin = dbUser.role === 'ADMIN';
    if (!isCreator && !isAdmin) {
      return NextResponse.json({ message: 'Only the creator or admin can edit' }, { status: 403 });
    }

    const body = await req.json();
    const { success, data, error: validationError } = validate(updateEventSchema, body);
    if (!success) return NextResponse.json({ message: validationError }, { status: 400 });

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;

    const event = await prisma.event.update({ where: { id }, data: updateData });
    return NextResponse.json({ message: 'Event updated', event }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error updating event');
  }
});

// DELETE /api/events/[id] — Delete event (admin only)
export const DELETE = withAuth(async (req, { params, user }) => {
  try {
    if (user.dbUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin only' }, { status: 403 });
    }
    await prisma.event.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Event deleted' }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error deleting event');
  }
});
