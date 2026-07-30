import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
  
  response.cookies.set('x-user-role', '', { path: '/', maxAge: 0 });
  response.cookies.set('x-user-id', '', { path: '/', maxAge: 0 });
  response.cookies.set('x-user-email', '', { path: '/', maxAge: 0 });

  return response;
}

export async function GET(req) {
  const origin = req.nextUrl.origin;
  const response = NextResponse.redirect(new URL('/login', origin));

  response.cookies.set('x-user-role', '', { path: '/', maxAge: 0 });
  response.cookies.set('x-user-id', '', { path: '/', maxAge: 0 });
  response.cookies.set('x-user-email', '', { path: '/', maxAge: 0 });

  return response;
}
