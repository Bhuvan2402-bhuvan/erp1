import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const userCtx = await getUser();
    if (!userCtx || !userCtx.dbUser) return NextResponse.json({ user: null }, { status: 401 });

    const dbUser = userCtx.dbUser;


    const response = NextResponse.json({ user: dbUser }, { status: 200 });
    response.cookies.set('x-user-role', dbUser.role, { 
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 86400 
    });
    response.cookies.set('x-user-id', dbUser.supabaseUid, { 
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 86400 
    });
    response.cookies.set('x-user-email', dbUser.email, { 
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 86400 
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ user: null, error: 'Internal server error' }, { status: 500 });
  }
}
