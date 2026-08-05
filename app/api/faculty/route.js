import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';

export async function GET(req) {
  try {
    const auth = await requireRole(['ADMIN', 'FACULTY']);
    if (!auth.authorized) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');
    const sortBy = searchParams.get('sortBy') || 'name-asc';

    const where = departmentId ? { departmentId } : {};

    let orderBy = { user: { name: 'asc' } };
    if (sortBy === 'name-desc') {
      orderBy = { user: { name: 'desc' } };
    } else if (sortBy === 'emp-asc') {
      orderBy = { employeeId: 'asc' };
    } else if (sortBy === 'emp-desc') {
      orderBy = { employeeId: 'desc' };
    } else if (sortBy === 'status') {
      orderBy = { user: { approvalStatus: 'asc' } };
    } else if (sortBy === 'department') {
      orderBy = { department: { code: 'asc' } };
    }

    const faculty = await prisma.faculty.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, approvalStatus: true, isBlocked: true } },
        department: { select: { id: true, name: true, code: true } }
      },
      orderBy
    });

    return NextResponse.json({ faculty }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching faculty' }, { status: 500 });
  }
}
