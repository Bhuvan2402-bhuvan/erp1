import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/public/messages — Recent messages
export async function GET() {
  try {
    const messages = await prisma.publicMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { author: { select: { name: true, role: true } } }
    });
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[GET /api/public/messages]', error);
    return NextResponse.json({ message: 'Error fetching public messages' }, { status: 500 });
  }
}

// POST /api/public/messages — Post message (any authenticated user)
export async function POST(request) {
  try {
    const userContext = await getUser();
    if (!userContext || !userContext.dbUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { dbUser } = userContext;

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ message: 'Content is required' }, { status: 400 });
    }

    const message = await prisma.publicMessage.create({
      data: {
        authorId: dbUser.id,
        content
      },
      include: { author: { select: { name: true, role: true } } }
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/public/messages]', error);
    return NextResponse.json({ message: 'Error posting public message' }, { status: 500 });
  }
}
