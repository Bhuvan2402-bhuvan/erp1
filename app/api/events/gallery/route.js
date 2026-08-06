import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sanitizeErrorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

// GET /api/events/gallery — List photos of completed and active events across all branches
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status') || 'COMPLETED';

    const where = {};
    if (departmentId) {
      where.event = {
        createdBy: {
          departmentId
        }
      };
    }
    if (status && status !== 'ALL') {
      where.event = {
        ...where.event,
        status: status
      };
    }

    const photos = await prisma.eventPhoto.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            endDate: true,
            location: true,
            type: true,
            status: true,
            createdBy: {
              select: {
                name: true,
                role: true,
                department: { select: { id: true, name: true, code: true } }
              }
            }
          }
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true
          }
        }
      }
    });

    const formattedPhotos = photos.map(p => ({
      id: p.id,
      url: p.url,
      caption: p.caption || '',
      createdAt: p.createdAt,
      eventId: p.eventId,
      eventTitle: p.event?.title,
      eventDescription: p.event?.description,
      eventDate: p.event?.date,
      eventLocation: p.event?.location,
      eventType: p.event?.type,
      eventStatus: p.event?.status,
      uploadedBy: p.uploadedBy?.name,
      uploaderRole: p.uploadedBy?.role,
      departmentName: p.event?.createdBy?.department?.name || 'General Branch',
      departmentCode: p.event?.createdBy?.department?.code || 'GEN'
    }));

    return NextResponse.json({ photos: formattedPhotos }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching event gallery');
  }
}
