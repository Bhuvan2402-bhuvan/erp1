export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';

// GET /api/villages — List adopted villages
// Admin sees all; Faculty sees only their assigned villages
export const GET = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where = {};
    if (status) where.status = status;

    // Faculty only sees villages assigned to them
    if (dbUser.role === 'FACULTY') {
      if (!dbUser.faculty) {
        return NextResponse.json({ villages: [] }, { status: 200 });
      }
      where.facultyId = dbUser.faculty.id;
    }

    const villages = await prisma.adoptedVillage.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } },
        faculty: {
          include: {
            user: { select: { name: true, email: true } },
            department: { select: { name: true, code: true } }
          }
        },
        _count: { select: { weeklyReports: true } }
      },
      orderBy: [{ status: 'asc' }, { adoptedDate: 'desc' }]
    });

    return NextResponse.json({ villages }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching villages');
  }
});

// POST /api/villages — Admin assigns a new village
export const POST = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { name, district, description, departmentId, facultyId, adoptedDate, status } = body;

    if (!name || !district || !departmentId || !facultyId) {
      return NextResponse.json(
        { message: 'Village name, district, department, and faculty are required' },
        { status: 400 }
      );
    }

    // Verify department and faculty exist
    const [dept, faculty] = await Promise.all([
      prisma.department.findUnique({ where: { id: departmentId } }),
      prisma.faculty.findUnique({ where: { id: facultyId } })
    ]);

    if (!dept) return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    if (!faculty) return NextResponse.json({ message: 'Faculty not found' }, { status: 404 });

    const village = await prisma.adoptedVillage.create({
      data: {
        name,
        district,
        description: description || null,
        departmentId,
        facultyId,
        adoptedDate: adoptedDate ? new Date(adoptedDate) : new Date(),
        status: status || 'ACTIVE'
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        faculty: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      }
    });

    return NextResponse.json({ message: 'Village assigned successfully', village }, { status: 201 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error assigning village');
  }
});
