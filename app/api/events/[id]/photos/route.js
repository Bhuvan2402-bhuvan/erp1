import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { validate, eventPhotoSchema } from '@/lib/validations';

// GET /api/events/[id]/photos — Get photos for an event
export const GET = withAuth(async (req, { params }) => {
  try {
    const photos = await prisma.eventPhoto.findMany({
      where: { eventId: params.id },
      include: { uploadedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ photos }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching photos');
  }
});

// POST /api/events/[id]/photos — Upload photo metadata (Admin, Faculty, Coordinator)
export const POST = withAuth(async (req, { params, user }) => {
  try {
    const { dbUser } = user;
    const isCoordinator = dbUser.student?.isCoordinator;
    if (dbUser.role === 'STUDENT' && !isCoordinator) {
      return NextResponse.json({ message: 'Only coordinators can upload photos' }, { status: 403 });
    }

    const body = await req.json();
    const { success, data: validated, error: validationError } = validate(eventPhotoSchema, body);
    if (!success) return NextResponse.json({ message: validationError }, { status: 400 });

    const { url, caption } = validated;
    const photo = await prisma.eventPhoto.create({
      data: { eventId: params.id, url, caption, uploadedById: dbUser.id }
    });

    return NextResponse.json({ message: 'Photo added', photo }, { status: 201 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error uploading photo');
  }
});
