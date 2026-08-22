import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req) {
  let body = {};
  try {
    body = await req.json().catch(() => ({}));
    const { accessToken, fallbackEmail } = body;

    let uid = null;
    let email = null;

    const isProd = process.env.NODE_ENV === 'production';
    const allowDevFallback = process.env.ALLOW_DEV_AUTH_FALLBACK === 'true';

    if (accessToken && accessToken !== 'mock-fallback') {
      try {
        const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(accessToken);
        if (error || !supabaseUser) {
          throw new Error(error?.message || 'Invalid Supabase access token');
        }
        uid = supabaseUser.id;
        email = supabaseUser.email;
      } catch (authErr) {
        console.error('Supabase token verification notice:', authErr);
        if (!isProd && allowDevFallback && fallbackEmail) {
          email = fallbackEmail;
        } else {
          return NextResponse.json({ message: 'Invalid authentication token' }, { status: 401 });
        }
      }
    } else if (!isProd && allowDevFallback && fallbackEmail) {
      email = fallbackEmail;
    } else {
      return NextResponse.json({ message: 'Authentication token required' }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ message: 'Email address not associated with token' }, { status: 401 });
    }

    let dbUser = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        faculty: true,
        department: true
      }
    });

    if (!dbUser && uid) {
      dbUser = await prisma.user.findUnique({
        where: { supabaseUid: uid },
        include: {
          student: true,
          faculty: true,
          department: true
        }
      });
    }

    if (!dbUser && email) {
      // Auto-provision demo accounts on-demand to guarantee demo sign-in reliability
      const demoRoles = {
        'admin1@erp.com': { role: 'ADMIN', name: 'NSS Lead Admin 1' },
        'admin2@erp.com': { role: 'ADMIN', name: 'NSS Lead Admin 2' },
        'faculty1@erp.com': { role: 'FACULTY', name: 'Faculty Coordinator 1' },
        'faculty2@erp.com': { role: 'FACULTY', name: 'Faculty Coordinator 2' },
        'coord1@erp.com': { role: 'STUDENT', name: 'Student Coordinator 1', isCoordinator: true },
        'volunteer1@erp.com': { role: 'STUDENT', name: 'NSS Volunteer 1', isCoordinator: false },
      };

      if (demoRoles[email]) {
        const demoInfo = demoRoles[email];
        let dept = await prisma.department.findFirst();
        if (!dept) {
          dept = await prisma.department.create({
            data: { name: 'Computer Science & Engineering', code: 'CSE' }
          });
        }

        const generatedUid = uid || 'demo-uid-' + Math.random().toString(36).substring(2, 10);
        dbUser = await prisma.user.create({
          data: {
            supabaseUid: generatedUid,
            email,
            name: demoInfo.name,
            role: demoInfo.role,
            approvalStatus: 'APPROVED',
            departmentId: demoInfo.role !== 'ADMIN' ? dept.id : null
          },
          include: { student: true, faculty: true, department: true }
        });

        if (demoInfo.role === 'FACULTY') {
          await prisma.faculty.create({
            data: {
              userId: dbUser.id,
              employeeId: 'FAC1001',
              designation: 'Faculty Coordinator',
              departmentId: dept.id
            }
          });
        } else if (demoInfo.role === 'STUDENT') {
          await prisma.student.create({
            data: {
              userId: dbUser.id,
              rollNo: '21CSE101',
              year: 3,
              section: 'A',
              semester: 6,
              departmentId: dept.id,
              isCoordinator: demoInfo.isCoordinator || false,
              points: demoInfo.isCoordinator ? 120 : 50
            }
          });
        }

        // Re-query with full includes
        dbUser = await prisma.user.findUnique({
          where: { id: dbUser.id },
          include: { student: true, faculty: true, department: true }
        });
      }
    }

    if (!dbUser) {
      const response = NextResponse.json({ user: null, message: 'Onboarding required' }, { status: 200 });
      const placeholderUid = uid || 'mock-uid-' + Math.random().toString(36).substring(2, 10);

      response.cookies.set('x-user-id', placeholderUid, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 86400
      });
      response.cookies.set('x-user-email', email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 86400
      });
      response.cookies.set('x-user-role', 'STUDENT', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 86400
      });

      return response;
    }

    if (dbUser.isBlocked) {
      return NextResponse.json({ message: 'Your account has been blocked' }, { status: 403 });
    }

    const response = NextResponse.json({ user: dbUser, message: 'Session established successfully' }, { status: 200 });

    response.cookies.set('x-user-role', dbUser.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400
    });
    response.cookies.set('x-user-id', dbUser.supabaseUid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400
    });
    response.cookies.set('x-user-email', dbUser.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400
    });

    return response;
  } catch (error) {
    console.error('Session establishment error:', error);
    return NextResponse.json({ message: 'Internal server error during authentication' }, { status: 500 });
  }
}
