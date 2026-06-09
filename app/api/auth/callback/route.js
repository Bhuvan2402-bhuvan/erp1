import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

const callbackLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 1000 });

export async function GET(request) {
  // Rate limit: 20 callback attempts per IP per minute
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { success: withinLimit } = callbackLimiter.check(20, `callback:${ip}`);
  if (!withinLimit) {
    return NextResponse.redirect(`${new URL(request.url).origin}/login?error=too-many-requests`);
  }

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      // Upsert user in Prisma (handles both new Google signups and existing users)
      let userRec = await prisma.user.findUnique({
        where: { supabaseAuthId: data.user.id },
        include: { student: true, faculty: true }
      })

      if (!userRec) {
        userRec = await prisma.user.create({
          data: {
            supabaseAuthId: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
            avatarUrl: data.user.user_metadata?.avatar_url,
            role: 'STUDENT',
            approvalStatus: 'PENDING'
          },
          include: { student: true, faculty: true }
        })
      }

      // Determine redirect based on role and status — go directly to final pages
      let redirectUrl = `${origin}${next}`;

      if (next === '/') {
        if (userRec.isBlocked) {
          redirectUrl = `${origin}/login?error=account-blocked`;
        } else if (userRec.approvalStatus === 'REJECTED') {
          redirectUrl = `${origin}/login?error=account-rejected`;
        } else {
          const hasProfile = userRec.student || userRec.faculty;
          
          if (!hasProfile && userRec.role !== 'ADMIN') {
            redirectUrl = `${origin}/onboarding`;
          } else if (userRec.approvalStatus === 'PENDING') {
            redirectUrl = `${origin}/pending`;
          } else {
            // Go directly to the final dashboard page — no intermediate redirect
            if (userRec.role === 'ADMIN') redirectUrl = `${origin}/admin/overview`;
            else if (userRec.role === 'FACULTY') redirectUrl = `${origin}/faculty/branch`;
            else redirectUrl = `${origin}/student/events`;
          }
        }
      }

      const response = NextResponse.redirect(redirectUrl);

      // Set role cookie (reuse already-fetched userRec — no extra DB query)
      response.cookies.set('x-user-role', userRec.role, { 
        httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 86400 
      });
      
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`)
}
