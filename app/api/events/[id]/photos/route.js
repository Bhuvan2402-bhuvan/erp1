import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';
import { eventPhotoSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

// POST /api/events/:id/photos — Upload photo metadata
export async function POST(request, { params }) {
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

    const isCoordinator = dbUser.student?.isCoordinator;
    if (dbUser.role === 'STUDENT' && !isCoordinator) {
      return NextResponse.json({ success: false, message: 'Only coordinators can upload photos' }, { status: 403 });
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = eventPhotoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      }, { status: 400 });
    }

    const photo = await prisma.eventPhoto.create({
      data: {
        eventId: id,
        url: validation.data.url,
        caption: validation.data.caption || null,
        uploadedById: dbUser.id
      }
    });

    return NextResponse.json({ success: true, message: 'Photo uploaded successfully', photo }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/events/:id/photos]', error);
    return NextResponse.json({ success: false, message: 'Error uploading event photo' }, { status: 500 });
  }
}

// DELETE /api/events/:id/photos — Delete photo from event (requires ?photoId query param)
export async function DELETE(request, { params }) {
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
    const photoId = searchParams.get('photoId');
    if (!photoId) {
      return NextResponse.json({ success: false, message: 'photoId query parameter is required' }, { status: 400 });
    }

    const photo = await prisma.eventPhoto.findUnique({ where: { id: photoId } });
    if (!photo) {
      return NextResponse.json({ success: false, message: 'Photo not found' }, { status: 404 });
    }

    const isUploader = photo.uploadedById === dbUser.id;
    const isManager = dbUser.role === 'ADMIN' || dbUser.role === 'FACULTY' || dbUser.student?.isCoordinator;
    if (!isUploader && !isManager) {
      return NextResponse.json({ success: false, message: 'Forbidden: Insufficient deletion permissions' }, { status: 403 });
    }

    await prisma.eventPhoto.delete({ where: { id: photoId } });
    return NextResponse.json({ success: true, message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('[DELETE /api/events/:id/photos]', error);
    return NextResponse.json({ success: false, message: 'Error deleting photo' }, { status: 500 });
  }
}
