import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';

const loginLimiter = rateLimit({ interval: 15 * 60 * 1000, uniqueTokenPerInterval: 500 });

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { success: withinLimit } = loginLimiter.check(30, `login:${ip}`);
  if (!withinLimit) {
    return NextResponse.json({ message: 'Too many login attempts. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch Prisma User record
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { email: email.trim() }
        ]
      },
      include: {
        department: true,
        student: { include: { department: true } },
        faculty: { include: { department: true } }
      }
    });

    if (dbUser) {
      if (dbUser.isBlocked) {
        return NextResponse.json({ message: 'Your account has been blocked by an administrator.' }, { status: 403 });
      }

      if (dbUser.approvalStatus === 'REJECTED') {
        return NextResponse.json({ message: 'Your account registration was rejected.' }, { status: 403 });
      }
    }

    // 2. Try authenticating with Supabase Auth using ANON client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tfscwjipnqzuoicounex.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ZQ8G6A5N06wvyECl9nIcmA_uV2rum_u';
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    let authenticatedSupabaseUser = null;
    let accessToken = null;

    try {
      const { data: authData } = await anonClient.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (authData?.user && authData?.session) {
        authenticatedSupabaseUser = authData.user;
        accessToken = authData.session.access_token;
      }
    } catch (anonErr) {
      console.warn('Anon auth notice:', anonErr.message);
    }

    // 3. If Supabase auth didn't return a session but user exists in DB, ensure Supabase user exists & sync
    if (!authenticatedSupabaseUser && dbUser && supabaseAdmin) {
      try {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData?.users?.find(usr => usr.email.toLowerCase() === cleanEmail);
        if (existing) {
          await supabaseAdmin.auth.admin.updateUserById(existing.id, { password });
          authenticatedSupabaseUser = existing;
        } else {
          const { data: newUser } = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password,
            email_confirm: true,
            user_metadata: { name: dbUser.name, role: dbUser.role }
          });
          if (newUser?.user) authenticatedSupabaseUser = newUser.user;
        }
      } catch (syncErr) {
        console.warn('Admin user sync notice:', syncErr.message);
      }
    }

    // If neither database record nor Supabase Auth user exists, return invalid credentials
    if (!dbUser && !authenticatedSupabaseUser) {
      return NextResponse.json({ message: 'Invalid email address or password' }, { status: 401 });
    }

    // Update database record with Supabase UID if needed
    if (dbUser && authenticatedSupabaseUser && (!dbUser.supabaseUid || dbUser.supabaseUid !== authenticatedSupabaseUser.id)) {
      try {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { supabaseUid: authenticatedSupabaseUser.id }
        });
        dbUser.supabaseUid = authenticatedSupabaseUser.id;
      } catch (updErr) {
        console.warn('Could not update supabaseUid:', updErr.message);
      }
    }

    // Determine post-login redirect
    let redirect = '/student/events';
    const userRole = dbUser?.role || 'STUDENT';
    const userApproval = dbUser?.approvalStatus || 'APPROVED';

    if (userApproval === 'PENDING') {
      redirect = '/pending';
    } else if (userRole === 'ADMIN') {
      redirect = '/admin/overview';
    } else if (userRole === 'FACULTY') {
      redirect = '/faculty/branch';
    } else if (userRole === 'STUDENT') {
      redirect = '/student/events';
    }

    const response = NextResponse.json({
      success: true,
      user: dbUser,
      redirect,
      message: 'Login successful'
    }, { status: 200 });

    const uid = dbUser?.supabaseUid || authenticatedSupabaseUser?.id || 'usr-' + Math.random().toString(36).substring(2, 10);
    const userEmail = dbUser?.email || cleanEmail;

    // Set secure HTTP-Only session cookies
    response.cookies.set('x-user-id', uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400
    });
    response.cookies.set('x-user-email', userEmail, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400
    });
    response.cookies.set('x-user-role', userRole, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400
    });
    if (accessToken) {
      response.cookies.set('sb-access-token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 86400
      });
    }

    return response;

  } catch (error) {
    console.error('Server login error:', error);
    return NextResponse.json({ message: 'An internal error occurred during login' }, { status: 500 });
  }
}
