import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// POST /api/events/:id/register — Self-registration for students
export async function POST(request, { params }) {
  try {
    const userContext = await getUser();
    if (!userContext || !userContext.dbUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { dbUser } = userContext;
    const { id } = params;

    // Access protection
    if (dbUser.isBlocked) {
      return NextResponse.json({ success: false, message: 'Account is blocked' }, { status: 403 });
    }
    if (dbUser.approvalStatus !== 'APPROVED' && dbUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Account pending approval' }, { status: 403 });
    }

    if (!dbUser.student) {
      return NextResponse.json({ success: false, message: 'Only registered students can register for events' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    }

    if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
      return NextResponse.json({ success: false, message: `Cannot register for a ${event.status.toLowerCase()} event` }, { status: 400 });
    }

    const registration = await prisma.eventRegistration.upsert({
      where: { eventId_studentId: { eventId: id, studentId: dbUser.student.id } },
      create: { eventId: id, studentId: dbUser.student.id, status: 'REGISTERED' },
      update: { status: 'REGISTERED' }
    });

    return NextResponse.json({ success: true, message: 'Registered successfully', registration });
  } catch (error) {
    console.error('[POST /api/events/:id/register]', error);
    return NextResponse.json({ success: false, message: 'Error registering for event' }, { status: 500 });
  }
}
