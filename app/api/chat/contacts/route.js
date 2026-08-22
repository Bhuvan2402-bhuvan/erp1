import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/chat/contacts — Fetch potential contacts list (all approved users)
export async function GET(request) {
  try {
    const userContext = await getUser();
    if (!userContext || !userContext.dbUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { dbUser } = userContext;

    // Access protection
    if (dbUser.isBlocked) {
      return NextResponse.json({ success: false, message: 'Account is blocked' }, { status: 403 });
    }
    if (dbUser.approvalStatus !== 'APPROVED' && dbUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Account pending approval' }, { status: 403 });
    }

    const contacts = await prisma.user.findMany({
      where: {
        approvalStatus: 'APPROVED',
        isBlocked: false,
        id: { not: dbUser.id }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ success: true, contacts });
  } catch (error) {
    console.error('[GET /api/chat/contacts]', error);
    return NextResponse.json({ success: false, message: 'Error fetching contacts' }, { status: 500 });
  }
}
