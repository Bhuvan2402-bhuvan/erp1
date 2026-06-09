import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser, verifyAccess } from '@/lib/auth-helpers';
import { validate, publicMessageSchema } from '@/lib/validations';

// GET /api/public-messages — Get all public messages
export async function GET(req) {
  try {
    const userCtx = await getUser();
    if (!userCtx || !userCtx.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const access = verifyAccess(userCtx.dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.publicMessage.findMany({
        include: { author: { select: { name: true, role: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.publicMessage.count()
    ]);

    return NextResponse.json({ 
      messages,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching messages' }, { status: 500 });
  }
}

// POST /api/public-messages — Post a broadcast (Admin, Faculty only)
export async function POST(req) {
  try {
    const userCtx = await getUser();
    if (!userCtx || !userCtx.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    if (dbUser.role === 'STUDENT') {
      return NextResponse.json({ message: 'Only admin and faculty can post public messages' }, { status: 403 });
    }

    const body = await req.json();
    const { success, data: validated, error: validationError } = validate(publicMessageSchema, body);
    
    if (!success) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const { content } = validated;

    const msg = await prisma.publicMessage.create({
      data: { authorId: dbUser.id, content }
    });

    return NextResponse.json({ message: 'Posted', data: msg }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error posting message' }, { status: 500 });
  }
}
