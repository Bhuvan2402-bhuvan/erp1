import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { createClient } from '@supabase/supabase-js';
import { validate, resetPasswordSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({ interval: 15 * 60 * 1000, uniqueTokenPerInterval: 200 });

export const POST = withAuth(async (req, { params, user }) => {
  // Rate limit: 5 password resets per IP per 15 minutes
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

    // Initialize Supabase Admin Client using Service Role Key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await supabaseAdmin.auth.admin.updateUserById(dbUser.supabaseAuthId, {
      password: newPassword,
      user_metadata: { force_password_reset: true }
    });

    if (error) {
      console.error('Supabase Admin Error:', error);
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password forcefully reset' }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error resetting password');
  }
}, { roles: ['ADMIN', 'FACULTY'] });
