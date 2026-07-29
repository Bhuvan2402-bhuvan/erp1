import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser, verifyAccess } from '@/lib/auth-helpers';
import { validate, publicMessageSchema } from '@/lib/validations';
import { sanitizeErrorResponse } from '@/lib/api-helpers';

import { rateLimit } from '@/lib/rate-limit';

const broadcastLimiter = rateLimit({ interval: 10 * 60 * 1000, uniqueTokenPerInterval: 200 });

// GET /api/public-messages — Get all public messages
export async function GET(req) {
  try {
    const userCtx = await getUser();
    if (!userCtx || !userCtx.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const access = verifyAccess(userCtx.dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 100);
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
    return sanitizeErrorResponse(error, 'Error fetching messages');
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

    // Rate limit: 5 circular broadcasts per 10 minutes
    const { success: withinLimit } = broadcastLimiter.check(5, `broadcast:${dbUser.id}`);
    if (!withinLimit) {
      return NextResponse.json({ message: 'Too many circular broadcasts. Please wait before posting again.' }, { status: 429 });
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

    // Circular Broadcast: Dispatch notification to each and every active volunteer
    const activeVolunteers = await prisma.user.findMany({
      where: { role: 'STUDENT', approvalStatus: 'APPROVED', isBlocked: false },
      select: { id: true }
    });

    if (activeVolunteers.length > 0) {
      await prisma.notification.createMany({
        data: activeVolunteers.map(v => ({
          userId: v.id,
          title: '📢 New Circular Broadcast',
          message: content.length > 120 ? content.slice(0, 117) + '...' : content,
          type: 'INFO'
        }))
      });
    }

    return NextResponse.json({ message: 'Circular broadcasted to all volunteers', data: msg }, { status: 201 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error posting message');
  }
}
