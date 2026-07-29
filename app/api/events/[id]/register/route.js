import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { rateLimit } from '@/lib/rate-limit';

const registerLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

// POST /api/events/[id]/register — Register for event
export const POST = withAuth(async (req, { params, user }) => {
  try {
    const { dbUser } = user;
    if (!dbUser.student) {
      return NextResponse.json({ message: 'Only students can register for events' }, { status: 403 });
    }

    // Rate limit: 10 registrations per user per minute
    const { success: withinLimit } = registerLimiter.check(10, `register:${dbUser.id}`);
    if (!withinLimit) {
      return NextResponse.json({ message: 'Too many registration attempts. Please slow down.' }, { status: 429 });
    }

    const { id: eventId } = params;
    const studentId = dbUser.student.id;

    // Verify event exists and is open for registration
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    if (event.status === 'CANCELLED') {
      return NextResponse.json({ message: 'Cannot register for a cancelled event' }, { status: 400 });
    }
    if (event.status === 'COMPLETED') {
      return NextResponse.json({ message: 'Cannot register for a completed event' }, { status: 400 });
    }

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
    return sanitizeErrorResponse(error, 'Error registering for event');
  }
});

// DELETE /api/events/[id]/register — Cancel registration
export const DELETE = withAuth(async (req, { params, user }) => {
  try {
    const { dbUser } = user;
    if (!dbUser.student) {
      return NextResponse.json({ message: 'Only students can manage registrations' }, { status: 403 });
    }

    const { id: eventId } = params;
    const studentId = dbUser.student.id;

    await prisma.eventRegistration.updateMany({
      where: { eventId, studentId },
      data: { status: 'CANCELLED' }
    });

    return NextResponse.json({ message: 'Registration cancelled' }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error cancelling registration');
  }
});
