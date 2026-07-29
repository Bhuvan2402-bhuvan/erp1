import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { sanitizeErrorResponse } from '@/lib/api-helpers';

export async function GET(req) {
  try {
    const auth = await requireRole(['ADMIN']);
    if (!auth.authorized) {
      const status = auth.reason === 'unauthenticated' ? 401 : 403;
      return NextResponse.json({ message: auth.reason === 'unauthenticated' ? 'Unauthorized' : 'Forbidden' }, { status });
    }

    const [
      totalVolunteers, 
      totalFaculty, 
      pendingApprovals, 
      totalDepartments, 
      totalEvents, 
      openIssues,
      recentUsers,
      upcomingEvents
    ] = await Promise.all([
      prisma.student.count({ where: { user: { approvalStatus: 'APPROVED' } } }),
      prisma.faculty.count(),
      prisma.user.count({ where: { approvalStatus: 'PENDING', role: { not: 'ADMIN' } } }),
      prisma.department.count(),
      prisma.event.count(),
      prisma.issue.count({ where: { status: 'OPEN' } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, approvalStatus: true, createdAt: true }
      }),
      prisma.event.findMany({
        where: { status: 'UPCOMING' },
        take: 5,
        orderBy: { date: 'asc' },
        include: { _count: { select: { registrations: true } } }
      })
    ]);

    return NextResponse.json({
      stats: { totalVolunteers, totalFaculty, pendingApprovals, totalDepartments, totalEvents, openIssues },
      recentUsers,
      upcomingEvents
    }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching admin stats');
  }
}
