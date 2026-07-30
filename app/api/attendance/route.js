import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, getUser } from '@/lib/auth-helpers';

export async function GET(req) {
  try {
    const userCtx = await getUser();
    if (!userCtx || !userCtx.dbUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { dbUser } = userCtx;
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');
    const eventId = searchParams.get('eventId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status'); // 'present', 'absent'
    const search = searchParams.get('search');

    const where = {};

    // Role-based restrictions
    if (dbUser.role === 'STUDENT') {
      if (dbUser.student) {
        // Regular student sees their own attendance, coordinator can view their branch/coordinated events
        if (!dbUser.student.isCoordinator) {
          where.studentId = dbUser.student.id;
        } else if (departmentId) {
          where.student = { departmentId };
        }
      }
    } else if (dbUser.role === 'FACULTY') {
      // Faculty is scoped to their department if specified
      if (dbUser.faculty?.departmentId) {
        where.student = { departmentId: dbUser.faculty.departmentId };
      }
    }

    if (departmentId && dbUser.role === 'ADMIN') {
      where.student = { departmentId };
    }

    if (eventId) {
      where.eventId = eventId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (status === 'present') {
      where.present = true;
    } else if (status === 'absent') {
      where.present = false;
    }

    if (search) {
      where.OR = [
        { student: { user: { name: { contains: search, mode: 'insensitive' } } } },
        { student: { user: { email: { contains: search, mode: 'insensitive' } } } },
        { student: { rollNo: { contains: search, mode: 'insensitive' } } },
        { event: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const attendances = await prisma.eventAttendance.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            type: true,
            date: true,
            location: true,
            status: true
          }
        },
        student: {
          select: {
            id: true,
            rollNo: true,
            year: true,
            section: true,
            isCoordinator: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            },
            department: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: { markedAt: 'desc' },
      take: 200
    });

    // Summary metrics
    const totalCount = await prisma.eventAttendance.count({ where });
    const presentCount = await prisma.eventAttendance.count({
      where: { ...where, present: true }
    });
    const absentCount = totalCount - presentCount;
    const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    return NextResponse.json({
      attendances,
      stats: {
        totalRecords: totalCount,
        presentCount,
        absentCount,
        attendanceRate: rate
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Fetch attendance error:', error);
    return NextResponse.json({ message: 'Error fetching attendance records' }, { status: 500 });
  }
}
