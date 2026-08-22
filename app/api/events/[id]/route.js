import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser, requireRole } from '@/lib/auth-helpers';
import { updateEventSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

// GET /api/events/:id — Get event details with conditional relations
export async function GET(request, { params }) {
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
    if (!event) {
      return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('[GET /api/events/:id]', error);
    return NextResponse.json({ success: false, message: 'Error fetching event details' }, { status: 500 });
  }
}

// PUT /api/events/:id — Edit event details
export async function PUT(request, { params }) {
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

    const isManager = dbUser.role === 'ADMIN' ||
                      dbUser.role === 'FACULTY' ||
                      dbUser.student?.isCoordinator === true;

    if (!isManager) {
      return NextResponse.json({ success: false, message: 'Only faculty, coordinators, or admins can edit event details' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateEventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      }, { status: 400 });
    }

    const data = validation.data;
    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;

    const event = await prisma.event.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, message: 'Event updated successfully', event });
  } catch (error) {
    console.error('[PUT /api/events/:id]', error);
    return NextResponse.json({ success: false, message: 'Error updating event details' }, { status: 500 });
  }
}

// DELETE /api/events/:id — Admin only: Delete event
export async function DELETE(request, { params }) {
  try {
    const roleCheck = await requireRole(['ADMIN']);
    if (!roleCheck.authorized) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: roleCheck.reason === 'unauthenticated' ? 401 : 403 });
    }

    const { id } = params;
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('[DELETE /api/events/:id]', error);
    return NextResponse.json({ success: false, message: 'Error deleting event' }, { status: 500 });
  }
}
