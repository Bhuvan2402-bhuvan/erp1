import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/users — Query users list
export async function GET(request) {
  try {
    const roleCheck = await requireRole(['ADMIN', 'FACULTY', 'STUDENT']);
    if (!roleCheck.authorized) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: roleCheck.reason === 'unauthenticated' ? 401 : 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const approvalStatus = searchParams.get('approvalStatus');
    const search = searchParams.get('search');

    const where = {};
    if (role) where.role = role;
    if (approvalStatus) where.approvalStatus = approvalStatus;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        department: true,
        student: true,
        faculty: true
      }
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('[GET /api/users]', error);
    return NextResponse.json({ success: false, message: 'Error fetching users' }, { status: 500 });
  }
}
