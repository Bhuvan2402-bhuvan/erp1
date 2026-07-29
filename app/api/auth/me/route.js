export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const headerList = headers();
    const userEmail = headerList.get('x-user-email');
    const userId = headerList.get('x-user-id');

    let dbUser = null;
    if (userEmail) {
      dbUser = await prisma.user.findUnique({
        where: { email: userEmail },
        include: {
          student: { include: { department: true } },
          faculty: { include: { department: true } },
          department: true
        }
      });
    }

    if (!dbUser && userId) {
      dbUser = await prisma.user.findUnique({
        where: { firebaseUid: userId },
        include: {
          student: { include: { department: true } },
          faculty: { include: { department: true } },
          department: true
        }
      });
    }

    if (!dbUser) return NextResponse.json({ user: null }, { status: 401 });

    const response = NextResponse.json({ user: dbUser }, { status: 200 });
    response.cookies.set('x-user-role', dbUser.role, { 
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 86400 
    });
    response.cookies.set('x-user-id', dbUser.firebaseUid, { 
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
