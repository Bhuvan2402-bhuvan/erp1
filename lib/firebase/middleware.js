import { NextResponse } from 'next/server';

export async function updateSession(request) {
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/admin') || 
                           request.nextUrl.pathname.startsWith('/faculty') ||
                           request.nextUrl.pathname.startsWith('/student');

  // Skip auth checks on public routes (/login, /signup, /, /visitor, public APIs)
  if (!isProtectedRoute) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete('x-user-id');
    requestHeaders.delete('x-user-email');
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Check role cookie set upon post-login for RBAC routes
  const roleCookie = request.cookies.get('x-user-role')?.value;
  const userEmail = request.cookies.get('x-user-email')?.value || '';
  const userId = request.cookies.get('x-user-id')?.value || '';

  if (!roleCookie && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // RBAC checks
  if (isProtectedRoute && roleCookie) {
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

  const requestHeaders = new Headers(request.headers);
  if (userId) requestHeaders.set('x-user-id', userId);
  if (userEmail) requestHeaders.set('x-user-email', userEmail);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}
