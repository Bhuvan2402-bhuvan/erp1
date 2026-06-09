import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ user: null }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      include: {
        student: { include: { department: true } },
        faculty: { include: { department: true } },
        department: true
      }
    });

    if (!dbUser) return NextResponse.json({ user: null }, { status: 404 });

    const response = NextResponse.json({ user: dbUser }, { status: 200 });
    response.cookies.set('x-user-role', dbUser.role, { 
      httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 86400 
    });
    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ user: null, error: 'Internal server error' }, { status: 500 });
  }
}
