import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';
import { publicMessageSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

// GET /api/public-messages — List active circulars/bulletin board announcements
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

    const messages = await prisma.publicMessage.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            name: true,
            role: true,
            avatarUrl: true
          }
        }
      },
      take: 100
    });

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('[GET /api/public-messages]', error);
    return NextResponse.json({ success: false, message: 'Error fetching board announcements' }, { status: 500 });
  }
}

// POST /api/public-messages — Post announcement (Admins/Faculty/Coordinators)
export async function POST(request) {
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

    const isCoordinator = dbUser.student?.isCoordinator;
    const isManager = dbUser.role === 'ADMIN' || dbUser.role === 'FACULTY' || isCoordinator;

    if (!isManager) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = publicMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      }, { status: 400 });
    }

    const { content } = validation.data;

    const message = await prisma.publicMessage.create({
      data: {
        authorId: dbUser.id,
        content
      },
      include: {
        author: {
          select: {
            name: true,
            role: true,
            avatarUrl: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/public-messages]', error);
    return NextResponse.json({ success: false, message: 'Error posting announcement' }, { status: 500 });
  }
}
