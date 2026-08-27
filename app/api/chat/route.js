import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';
import { chatMessageSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

// GET /api/chat — Fetch messages between logged-in user and ?contactId
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

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId') || searchParams.get('userId');
    if (!contactId) {
      return NextResponse.json({ success: false, message: 'contactId parameter is required' }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: dbUser.id, receiverId: contactId },
          { senderId: contactId, receiverId: dbUser.id }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('[GET /api/chat]', error);
    return NextResponse.json({ success: false, message: 'Error fetching messages' }, { status: 500 });
  }
}

// POST /api/chat — Send message to receiverId
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

    const body = await request.json();
    const validation = chatMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      }, { status: 400 });
    }

    const { receiverId, content } = validation.data;

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return NextResponse.json({ success: false, message: 'Receiver user not found' }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: dbUser.id,
        receiverId,
        content
      }
    });

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/chat]', error);
    return NextResponse.json({ success: false, message: 'Error sending message' }, { status: 500 });
  }
}
