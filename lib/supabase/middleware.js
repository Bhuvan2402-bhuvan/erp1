import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function updateSession(request) {
  // Purge any pre-existing/spoofed auth headers to prevent header injection
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-user-id');
  requestHeaders.delete('x-user-email');

  // CSRF verification for mutating request methods
  const method = request.method;
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const origin = request.headers.get('origin');
    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.origin !== request.nextUrl.origin) {
          return new NextResponse(JSON.stringify({ message: 'CSRF validation failed: Origin mismatch' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (err) {
        return new NextResponse(JSON.stringify({ message: 'CSRF validation failed: Malformed origin' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const roleCookie = request.cookies.get('x-user-role')?.value;
  const userEmail = request.cookies.get('x-user-email')?.value || '';
  const userId = request.cookies.get('x-user-id')?.value || '';

  if (userId) requestHeaders.set('x-user-id', userId);
  if (userEmail) requestHeaders.set('x-user-email', userEmail);

  // Re-create next response with updated request headers so route handlers receive headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Preserve any cookies set by Supabase
  supabaseResponse.cookies.getAll().forEach((c) => {
    response.cookies.set(c.name, c.value, c);
  });

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/admin') ||
                           request.nextUrl.pathname.startsWith('/faculty') ||
                           request.nextUrl.pathname.startsWith('/student');

  if (!isProtectedRoute) {
    return response;
  }

  if (!roleCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // RBAC checks
  if (roleCookie) {
    if (request.nextUrl.pathname.startsWith('/admin') && roleCookie !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.nextUrl.origin));
    }
    if (request.nextUrl.pathname.startsWith('/faculty') && roleCookie !== 'FACULTY' && roleCookie !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.nextUrl.origin));
    }
    if (request.nextUrl.pathname.startsWith('/student') && roleCookie !== 'STUDENT' && roleCookie !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.nextUrl.origin));
    }
  }

  return response;
}

