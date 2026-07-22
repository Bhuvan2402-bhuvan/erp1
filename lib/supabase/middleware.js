import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  // Define protected routes that require authentication
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/admin') || 
                           request.nextUrl.pathname.startsWith('/faculty') ||
                           request.nextUrl.pathname.startsWith('/student');

  const isAuthRoute = request.nextUrl.pathname === '/login' || 
                      request.nextUrl.pathname === '/signup';

  // 1. Skip Supabase auth network calls on public/non-protected/non-auth routes (e.g. homepage, public APIs)
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Helper to handle redirects while copying Supabase cookies
  const redirect = (toUrl) => {
    const redirectResponse = NextResponse.redirect(toUrl)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  if (!user && isProtectedRoute) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return redirect(url)
  }

  if (user) {
    let roleCookie = request.cookies.get('x-user-role')?.value;

    // Determine if we need to fetch user data from the database
    // We need to fetch it if:
    // 1. We are on an auth route (to check block/approval status and redirect them to dashboard)
    // 2. Or we are on a protected route and the role cookie is missing
    const needsDbCheck = isAuthRoute || (isProtectedRoute && !roleCookie);

    let dbUser = null;
    if (needsDbCheck) {
      try {
        const { data } = await supabase
          .from('users')
          .select('role, approvalStatus, isBlocked')
          .eq('supabaseAuthId', user.id)
          .single();
        dbUser = data;
      } catch (err) {
        console.error('Error querying user in middleware:', err);
      }
    }

    // If we have dbUser, update/set the roleCookie and handle status checks
    if (dbUser) {
      roleCookie = dbUser.role;

      // 1. Blocked or Rejected
      if (dbUser.isBlocked || dbUser.approvalStatus === 'REJECTED') {
        supabaseResponse.cookies.set('x-user-role', '', { path: '/', maxAge: 0 });
        await supabase.auth.signOut();
        const errorParam = dbUser.isBlocked ? 'account-blocked' : 'account-rejected';
        return redirect(new URL(`/login?error=${errorParam}`, request.nextUrl.origin));
      }

      // Set/refresh x-user-role cookie
      supabaseResponse.cookies.set('x-user-role', roleCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 86400
      });

      // 2. Pending approval (Admins bypass pending check)
      if (dbUser.approvalStatus === 'PENDING' && dbUser.role !== 'ADMIN') {
        if (request.nextUrl.pathname !== '/pending') {
          return redirect(new URL('/pending', request.nextUrl.origin));
        }
        return supabaseResponse;
      }
    }

    // If they are logged in but don't exist in Prisma DB at all (needs onboarding)
    // Only check if we queried DB and got null
    if (needsDbCheck && !dbUser && !isAuthRoute) {
      if (request.nextUrl.pathname !== '/onboarding') {
        return redirect(new URL('/onboarding', request.nextUrl.origin));
      }
      return supabaseResponse;
    }

    // RBAC: Check route access
    if (isProtectedRoute && roleCookie) {
      if (request.nextUrl.pathname.startsWith('/admin') && roleCookie !== 'ADMIN') {
        return redirect(new URL('/', request.nextUrl.origin));
      }
      if (request.nextUrl.pathname.startsWith('/faculty') && roleCookie !== 'FACULTY' && roleCookie !== 'ADMIN') {
        return redirect(new URL('/', request.nextUrl.origin));
      }
    }

    // Redirect authenticated users away from login/signup to their dashboard
    if (isAuthRoute && roleCookie) {
      const url = request.nextUrl.clone();
      if (roleCookie === 'ADMIN') {
        url.pathname = '/admin/overview';
      } else if (roleCookie === 'FACULTY') {
        url.pathname = '/faculty/branch';
      } else {
        url.pathname = '/student/events';
      }
      return redirect(url);
    }
  }

  // Clear role cookie if no active Supabase session
  if (!user && request.cookies.has('x-user-role')) {
    supabaseResponse.cookies.set('x-user-role', '', { path: '/', maxAge: 0 })
  }

  // Set downstream headers to bypass Supabase getUser() calls in downstream Server Components
  if (user) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email || '');

    const finalResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie.name, cookie.value, cookie);
    });

    return finalResponse;
  }

  return supabaseResponse;
}
