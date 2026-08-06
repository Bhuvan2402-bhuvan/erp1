import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sanitizeErrorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [
      totalVolunteers,
      totalCoordinators,
      totalFaculty,
      totalEvents,
      departmentStats,
      recentPhotos,
      events,
      facultyProfiles
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT', approvalStatus: 'APPROVED' } }),
      prisma.student.count({ where: { isCoordinator: true } }),
      prisma.user.count({ where: { role: 'FACULTY', approvalStatus: 'APPROVED' } }),
      prisma.event.count(),
      prisma.department.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          _count: { select: { students: true } }
        }
      }),
      prisma.eventPhoto.findMany({
        orderBy: { createdAt: 'desc' },
        take: 48,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              description: true,
              date: true,
              location: true,
              type: true,
              status: true,
              createdBy: {
                select: {
                  department: { select: { name: true, code: true } }
                }
              }
            }
          },
          uploadedBy: {
            select: { name: true, role: true }
          }
        }
      }),
      prisma.event.findMany({
        orderBy: { date: 'desc' },
        take: 30,
        include: {
          _count: { select: { registrations: true, photos: true } },
          createdBy: {
            select: {
              department: { select: { name: true, code: true } }
            }
          }
        }
      }),
      prisma.facultyDesk.findMany({
        where: { isVisible: true },
        orderBy: [
          { role: 'asc' },
          { sortOrder: 'asc' },
          { createdAt: 'asc' }
        ]
      })
    ]);

    const formattedPhotos = recentPhotos.map(p => ({
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
      departmentName: p.event?.createdBy?.department?.name || 'NSS Unit',
      departmentCode: p.event?.createdBy?.department?.code || 'NSS'
    }));

    const formattedEvents = events.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      type: e.type,
      status: e.status,
      date: e.date,
      location: e.location,
      registrationsCount: e._count.registrations,
      photosCount: e._count.photos,
      departmentName: e.createdBy?.department?.name || 'NSS Unit',
      departmentCode: e.createdBy?.department?.code || 'NSS'
    }));

    // Sort faculty profiles: PC first, POs second
    const sortedFaculty = facultyProfiles.sort((a, b) => {
      if (a.role === 'NSS_PC' && b.role !== 'NSS_PC') return -1;
      if (a.role !== 'NSS_PC' && b.role === 'NSS_PC') return 1;
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    }).map(p => ({
      ...p,
      achievements: Array.isArray(p.achievements) ? p.achievements : []
    }));

    return NextResponse.json({
      stats: {
        totalVolunteers,
        totalCoordinators,
        totalFaculty,
        totalEvents
      },
      departments: departmentStats.map(d => ({
        id: d.id,
        name: d.name,
        code: d.code,
        count: d._count.students
      })),
      photos: formattedPhotos,
      events: formattedEvents,
      facultyDesk: sortedFaculty
    }, { status: 200 });

  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching visitor data');
  }
}
