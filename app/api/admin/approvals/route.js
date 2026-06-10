import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { sanitizeErrorResponse } from '@/lib/api-helpers';

export async function GET(req) {
  try {
    const auth = await requireRole(['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const pendingUsers = await prisma.user.findMany({
      where: {
        approvalStatus: 'PENDING',
        role: { in: ['STUDENT', 'FACULTY'] }
      },
      include: {
        department: true,
        student: {
          include: {
            department: true
          }
        },
        faculty: {
          include: {
            department: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ pendingUsers }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching pending approvals');
  }
}
