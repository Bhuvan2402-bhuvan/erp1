import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { validate, sendMessageSchema } from '@/lib/validations';

import { rateLimit } from '@/lib/rate-limit';

const chatLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

// GET /api/chat — Get messages between two users (or list conversations)
export const GET = withAuth(async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get('userId');
    const myId = user.dbUser.id;

    if (!otherUserId) {
      // Return list of distinct users chatted with (sent or received messages)
      const [sent, received] = await Promise.all([
        prisma.message.findMany({
          where: { senderId: myId },
          select: { receiverId: true },
          distinct: ['receiverId'],
        }),
        prisma.message.findMany({
          where: { receiverId: myId },
          select: { senderId: true },
          distinct: ['senderId'],
        }),
      ]);

      const contactIds = [
        ...new Set([
          ...sent.map(m => m.receiverId),
          ...received.map(m => m.senderId),
        ]),
      ].filter(id => id !== myId);

      const users = await prisma.user.findMany({
        where: { id: { in: contactIds } },
        select: { id: true, name: true, email: true, role: true, avatarUrl: true },
      });

      return NextResponse.json({ conversations: users }, { status: 200 });
    }

    // Return messages between me and the other user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: myId }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching messages');
  }
});

// POST /api/chat — Send a message
export const POST = withAuth(async (req, { user }) => {
  try {
    const dbUser = user.dbUser;

    // Rate limit: 30 messages per user per minute
    const { success: withinLimit } = chatLimiter.check(30, `chat:${dbUser.id}`);
    if (!withinLimit) {
      return NextResponse.json({ message: 'Too many messages sent. Please wait a moment.' }, { status: 429 });
    }

    const body = await req.json();
    const { success, data: validated, error: validationError } = validate(sendMessageSchema, body);
    if (!success) return NextResponse.json({ message: validationError }, { status: 400 });

    const { receiverId, content } = validated;

    // Verify chat roster eligibility
    if (dbUser.role !== 'ADMIN') {
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        include: { student: true, faculty: true }
      });
      if (!receiver) return NextResponse.json({ message: 'Receiver not found' }, { status: 404 });

      let isAllowed = false;
      if (receiver.role === 'ADMIN') {
        isAllowed = true;
      } else if (dbUser.role === 'FACULTY') {
        const facultyDeptId = dbUser.faculty?.departmentId;
        if (receiver.role === 'STUDENT' && receiver.student?.departmentId === facultyDeptId) {
          isAllowed = true;
        }
      } else if (dbUser.role === 'STUDENT') {
        const studentDeptId = dbUser.student?.departmentId;
        const isCoordinator = dbUser.student?.isCoordinator;

        if (receiver.role === 'FACULTY' && receiver.faculty?.departmentId === studentDeptId) {
          isAllowed = true;
        } else if (receiver.role === 'STUDENT' && receiver.student?.isCoordinator) {
          isAllowed = true;
        } else if (isCoordinator && receiver.role === 'STUDENT' && receiver.student?.departmentId === studentDeptId) {
          isAllowed = true;
        }
      }

      if (!isAllowed) {
        return NextResponse.json({ message: 'You are not authorized to message this user' }, { status: 403 });
      }
    }

    const message = await prisma.message.create({
      data: { senderId: dbUser.id, receiverId, content }
    });

    return NextResponse.json({ message: 'Sent', data: message }, { status: 201 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error sending message');
  }
});
