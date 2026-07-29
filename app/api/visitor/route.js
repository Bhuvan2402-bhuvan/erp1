import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sanitizeErrorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [totalVolunteers, totalCoordinators, totalFaculty, totalEvents, departmentStats, volunteers] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT', approvalStatus: 'APPROVED' } }),
      prisma.student.count({ where: { isCoordinator: true } }),
      prisma.user.count({ where: { role: 'FACULTY', approvalStatus: 'APPROVED' } }),
      prisma.event.count(),
      prisma.department.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          _count: {
            select: { students: true }
          }
        }
      }),
      prisma.student.findMany({
        where: {
          user: {
            approvalStatus: 'APPROVED',
            isBlocked: false
          }
        },
        select: {
          id: true,
          rollNo: true,
          year: true,
          section: true,
          isCoordinator: true,
          points: true,
          user: {
            select: {
              name: true,
              avatarUrl: true
            }
          },
          department: {
            select: {
              name: true,
              code: true
            }
          }
        },
        orderBy: { points: 'desc' },
        take: 100
      })
    ]);

    const formattedVolunteers = volunteers.map(v => ({
      id: v.id,
      name: v.user.name,
      avatarUrl: v.user.avatarUrl,
      department: v.department.name,
      departmentCode: v.department.code,
      rollNo: v.rollNo,
      year: v.year,
      section: v.section,
      isCoordinator: v.isCoordinator,
      points: v.points || 0
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
      volunteers: formattedVolunteers
    }, { status: 200 });

  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching visitor data');
  }
}
