import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';

// POST /api/events/[id]/register — Register for event
export async function POST(req, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx || !userCtx.dbUser.student) {
      return NextResponse.json({ message: 'Only students can register for events' }, { status: 403 });
    }

    const { id: eventId } = params;
    const studentId = userCtx.dbUser.student.id;

    // Check if already registered
    const existing = await prisma.eventRegistration.findUnique({
      where: { eventId_studentId: { eventId, studentId } }
    });

    if (existing) {
      if (existing.status === 'CANCELLED') {
        // Re-register
        await prisma.eventRegistration.update({
          where: { id: existing.id },
          data: { status: 'REGISTERED' }
        });
        return NextResponse.json({ message: 'Re-registered for event' }, { status: 200 });
      }
      return NextResponse.json({ message: 'Already registered' }, { status: 409 });
    }

    await prisma.eventRegistration.create({
      data: { eventId, studentId }
    });

    return NextResponse.json({ message: 'Registered successfully' }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error registering' }, { status: 500 });
  }
}

// DELETE /api/events/[id]/register — Cancel registration
export async function DELETE(req, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx || !userCtx.dbUser.student) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { id: eventId } = params;
    const studentId = userCtx.dbUser.student.id;

    await prisma.eventRegistration.updateMany({
      where: { eventId, studentId },
      data: { status: 'CANCELLED' }
    });

    return NextResponse.json({ message: 'Registration cancelled' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error cancelling' }, { status: 500 });
  }
}
