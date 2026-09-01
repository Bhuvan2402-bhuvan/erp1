import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error') || searchParams.get('error_description');
  const nextParam = searchParams.get('next');

  if (errorParam) {
    console.error('OAuth callback error from provider:', errorParam);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorParam)}`, origin));
  }

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.session?.user) {
      const user = data.session.user;
      const email = user.email?.toLowerCase();
      const supabaseUid = user.id;
      const meta = user.user_metadata || {};
      const googleName = meta.full_name || meta.name || user.name || '';
      const googleAvatar = meta.avatar_url || meta.picture || '';

      if (!email) {
        return NextResponse.redirect(new URL('/login?error=no-email-from-google', origin));
      }

      let dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { supabaseUid }
          ]
        },
        include: { student: true, faculty: true }
      });

      // Auto-link supabaseUid or update avatar from Google if missing
      if (dbUser) {
        const updates = {};
        if (!dbUser.supabaseUid || dbUser.supabaseUid !== supabaseUid) {
          updates.supabaseUid = supabaseUid;
        }
        if (!dbUser.avatarUrl && googleAvatar) {
          updates.avatarUrl = googleAvatar;
        }
        if (Object.keys(updates).length > 0) {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: updates,
            include: { student: true, faculty: true }
          }).catch(() => dbUser);
        }
      }

      let targetRoute = '/student/events';

      if (!dbUser) {
        targetRoute = '/onboarding';
      } else if (dbUser.isBlocked) {
        targetRoute = '/login?error=account-blocked';
      } else if (dbUser.approvalStatus === 'REJECTED') {
        targetRoute = '/login?error=account-rejected';
      } else if (dbUser.approvalStatus === 'PENDING') {
        targetRoute = '/pending';
      } else if (!dbUser.student && !dbUser.faculty && dbUser.role !== 'ADMIN') {
        targetRoute = '/onboarding';
      } else if (nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')) {
        targetRoute = nextParam;
      } else if (dbUser.role === 'ADMIN') {
        targetRoute = '/admin/overview';
      } else if (dbUser.role === 'FACULTY') {
        targetRoute = '/faculty/branch';
      }

      const response = NextResponse.redirect(new URL(targetRoute, origin));

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 86400 * 7 // 7 days
      };

      if (dbUser) {
        response.cookies.set('x-user-role', dbUser.role, cookieOptions);
        response.cookies.set('x-user-id', dbUser.supabaseUid || supabaseUid, cookieOptions);
        response.cookies.set('x-user-email', dbUser.email, cookieOptions);
      } else {
        response.cookies.set('x-user-id', supabaseUid, cookieOptions);
        response.cookies.set('x-user-email', email, cookieOptions);
        response.cookies.set('x-user-role', 'STUDENT', cookieOptions);
      }

      return response;
    } else if (error) {
      console.error('Session exchange error:', error);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message || 'auth-callback-failed')}`, origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth-callback-failed', origin));
}


