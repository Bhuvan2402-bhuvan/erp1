import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';

const loginLimiter = rateLimit({ interval: 15 * 60 * 1000, uniqueTokenPerInterval: 500 });

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { success: withinLimit } = loginLimiter.check(10, `login:${ip}`);
  if (!withinLimit) {
    return NextResponse.json({ message: 'Too many login attempts. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // 1. Authenticate with Supabase Auth server-side
    const { data, error: authErr } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (authErr || !data?.user || !data?.session) {
      return NextResponse.json({ message: authErr?.message || 'Invalid email or password' }, { status: 401 });
    }

    const supabaseUser = data.user;
    const accessToken = data.session.access_token;

    // 2. Fetch corresponding Prisma User record
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseUid: supabaseUser.id },
          { email: supabaseUser.email }
        ]
      },
      include: {
        department: true,
        student: { include: { department: true } },
        faculty: { include: { department: true } }
      }
    });

    // If database record is missing, sync supabaseUid if matched by email
    if (!dbUser && supabaseUser.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: supabaseUser.email },
        include: { department: true, student: true, faculty: true }
      });
      if (dbUser && !dbUser.supabaseUid) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { supabaseUid: supabaseUser.id }
        });
        dbUser.supabaseUid = supabaseUser.id;
      }
    }

    if (!dbUser) {
      const response = NextResponse.json({
        success: true,
        redirect: '/onboarding',
        message: 'Account authentication successful. Onboarding required.'
      }, { status: 200 });

      response.cookies.set('sb-access-token', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 86400 });
      return response;
    }

    if (dbUser.isBlocked) {
      return NextResponse.json({ message: 'Your account has been blocked by an administrator.' }, { status: 403 });
    }

    if (dbUser.approvalStatus === 'REJECTED') {
      return NextResponse.json({ message: 'Your account registration was rejected.' }, { status: 403 });
    }

    // Determine post-login redirect
    let redirect = '/student/events';
    if (dbUser.approvalStatus === 'PENDING') {
      redirect = '/pending';
    } else if (dbUser.role === 'ADMIN') {
      redirect = '/admin/overview';
    } else if (dbUser.role === 'FACULTY') {
      redirect = '/faculty/branch';
    } else if (dbUser.role === 'STUDENT') {
      redirect = '/student/events';
    }

    const response = NextResponse.json({
      success: true,
      user: dbUser,
      redirect,
      message: 'Login successful'
    }, { status: 200 });

    // Set secure HTTP-Only session cookies
    response.cookies.set('x-user-id', dbUser.supabaseUid || supabaseUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400
    });
    response.cookies.set('x-user-email', dbUser.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400
    });
    response.cookies.set('x-user-role', dbUser.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400
    });
    response.cookies.set('sb-access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400
    });

    return response;

  } catch (error) {
    console.error('Server login error:', error);
    return NextResponse.json({ message: 'An internal error occurred during login' }, { status: 500 });
  }
}
