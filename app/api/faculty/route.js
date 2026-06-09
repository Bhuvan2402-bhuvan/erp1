import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';

export async function GET(req) {
  try {
    const auth = await requireRole(['ADMIN', 'FACULTY']);
    if (!auth.authorized) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');

    const where = departmentId ? { departmentId } : {};

    const faculty = await prisma.faculty.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, approvalStatus: true, isBlocked: true } },
        department: { select: { name: true, code: true } }
      },
      orderBy: { user: { name: 'asc' } }
    });

    return NextResponse.json({ faculty }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching faculty' }, { status: 500 });
  }
}
