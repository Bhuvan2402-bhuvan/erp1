import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { validate, resetPasswordSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';
import { adminAuth } from '@/lib/firebase/admin';

const limiter = rateLimit({ interval: 15 * 60 * 1000, uniqueTokenPerInterval: 200 });

export const POST = withAuth(async (req, { params, user }) => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { success: withinLimit } = limiter.check(5, `reset-pw:${ip}`);
  if (!withinLimit) {
    return NextResponse.json({ message: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const auth = user;
    if (!['ADMIN', 'FACULTY'].includes(auth.dbUser.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { success, data: validated, error: validationError } = validate(resetPasswordSchema, body);
    if (!success) return NextResponse.json({ message: validationError }, { status: 400 });

    const { newPassword } = validated;

    const dbUser = await prisma.user.findUnique({ where: { id } });
    if (!dbUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const caller = auth.dbUser;
    if (caller.role !== 'ADMIN') {
      const targetStudent = await prisma.student.findUnique({ where: { userId: id } });
      if (!targetStudent || targetStudent.departmentId !== caller.faculty?.departmentId) {
        return NextResponse.json({ message: 'Forbidden. You can only reset passwords for students in your own department.' }, { status: 403 });
      }
    }

    try {
      await adminAuth.updateUser(dbUser.firebaseUid, {
        password: newPassword,
      });
    } catch (authErr) {
      console.error('Firebase Admin update password error:', authErr.message);
      return NextResponse.json({ message: 'Failed to reset password in authentication system. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Password forcefully reset' }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error resetting password');
  }
}, { roles: ['ADMIN', 'FACULTY'] });
