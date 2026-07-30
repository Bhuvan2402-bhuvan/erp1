import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.session?.user) {
      const email = data.session.user.email;
      const supabaseUid = data.session.user.id;

      let dbUser = await prisma.user.findUnique({
        where: { email },
        include: { student: true, faculty: true }
      });

      let targetRoute = '/student/events';

      if (!dbUser) {
        targetRoute = '/onboarding';
      } else if (dbUser.isBlocked) {
        targetRoute = '/login?error=account-blocked';
      } else if (dbUser.approvalStatus === 'REJECTED') {
        targetRoute = '/login?error=account-rejected';
      } else if (dbUser.approvalStatus === 'PENDING') {
        targetRoute = '/pending';
      } else if (dbUser.role === 'ADMIN') {
        targetRoute = '/admin/overview';
      } else if (dbUser.role === 'FACULTY') {
        targetRoute = '/faculty/branch';
      }

      const response = NextResponse.redirect(new URL(targetRoute, origin));

      if (dbUser) {
        response.cookies.set('x-user-role', dbUser.role, {
          httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 86400
        });
        response.cookies.set('x-user-id', dbUser.supabaseUid || supabaseUid, {
          httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 86400
        });
        response.cookies.set('x-user-email', dbUser.email, {
          httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 86400
        });
      } else {
        response.cookies.set('x-user-id', supabaseUid, {
          httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 86400
        });
        response.cookies.set('x-user-email', email, {
          httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 86400
        });
      }

      return response;
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth-callback-failed', origin));
}

