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
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
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

  // Clear role cookie if no active Supabase session
  if (!user && request.cookies.has('x-user-role')) {
    supabaseResponse.cookies.set('x-user-role', '', { path: '/', maxAge: 0 })
  }

  if (!user && isProtectedRoute) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return redirect(url)
  }

  if (user && isProtectedRoute) {
    let roleCookie = request.cookies.get('x-user-role')?.value;
    
    if (!roleCookie) {
      try {
        const res = await fetch(new URL('/api/auth/me', request.nextUrl.origin), {
          headers: {
            cookie: request.headers.get('cookie') || ''
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user?.role) {
            roleCookie = data.user.role;
            supabaseResponse.cookies.set('x-user-role', roleCookie, {
              httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 86400
            });
          }
        } else if (res.status === 404) {
          return redirect(new URL('/onboarding', request.nextUrl.origin));
        } else {
          return redirect(new URL('/login', request.nextUrl.origin));
        }
      } catch (err) {
        console.error('Failed to fetch user role in middleware:', err);
      }
    }
    
    // RBAC: Block if role is missing or insufficient for the route
    if (request.nextUrl.pathname.startsWith('/admin') && roleCookie !== 'ADMIN') {
      return redirect(new URL('/', request.nextUrl.origin));
    }
    if (request.nextUrl.pathname.startsWith('/faculty') && roleCookie !== 'FACULTY' && roleCookie !== 'ADMIN') {
      return redirect(new URL('/', request.nextUrl.origin));
    }
  }

  if (user && isAuthRoute) {
    const roleCookie = request.cookies.get('x-user-role')?.value;
    if (roleCookie) {
      const url = request.nextUrl.clone()
      if (roleCookie === 'ADMIN') {
        url.pathname = '/admin/overview'
      } else if (roleCookie === 'FACULTY') {
        url.pathname = '/faculty/branch'
      } else {
        url.pathname = '/student/events'
      }
      return redirect(url)
    }
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

  return supabaseResponse
}
