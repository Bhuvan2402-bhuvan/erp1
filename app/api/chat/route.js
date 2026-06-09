import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { validate, sendMessageSchema } from '@/lib/validations';

// GET /api/chat — Get messages between two users (or list conversations)
export const GET = withAuth(async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get('userId');
    const myId = user.dbUser.id;

    if (!otherUserId) {
      // Return list of conversations (distinct users chatted with)
      const users = await prisma.$queryRaw`
        SELECT id, name, email, role, "avatarUrl"
        FROM users
        WHERE id IN (
          SELECT "receiverId" FROM messages WHERE "senderId" = ${myId}
          UNION
          SELECT "senderId" FROM messages WHERE "receiverId" = ${myId}
        )
      `;
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
    const body = await req.json();
    const { success, data: validated, error: validationError } = validate(sendMessageSchema, body);
    if (!success) return NextResponse.json({ message: validationError }, { status: 400 });

    const { receiverId, content } = validated;
    const dbUser = user.dbUser;

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
