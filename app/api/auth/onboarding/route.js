import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';
import { validate, onboardingSchema } from '@/lib/validations';
import { sendAccountCreatedEmail } from '@/lib/email';
import { headers, cookies } from 'next/headers';

export async function POST(req) {
  try {
    const headersList = headers();
    const cookieList = cookies();

    const headerUserId = headersList.get('x-user-id') || cookieList.get('x-user-id')?.value;
    const headerUserEmail = headersList.get('x-user-email') || cookieList.get('x-user-email')?.value;

    const body = await req.json();
    const { success, data: validated, error: validationError } = validate(onboardingSchema, body);
    
    if (!success) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const { role, departmentId, rollNo, year, section, semester, employeeId, designation, name: bodyName } = validated;

    const email = headerUserEmail || body.email;
    const supabaseUid = headerUserId || body.supabaseUid;

    if (!email) {
      return NextResponse.json({ message: 'Authentication required. Missing user identity.' }, { status: 401 });
    }

    let dbUser = await prisma.user.findUnique({
      where: { email },
      include: { student: true, faculty: true }
    });

    if (!dbUser && supabaseUid) {
      dbUser = await prisma.user.findUnique({
        where: { supabaseUid },
        include: { student: true, faculty: true }
      });
    }

    // Prevent duplicate onboarding; if profile is already completed, return success with target redirect URL
    if (dbUser && (dbUser.student || dbUser.faculty)) {
      const targetUrl = dbUser.approvalStatus === 'PENDING' ? '/pending' : (dbUser.role === 'FACULTY' ? '/faculty/branch' : '/student/events');
      const response = NextResponse.json({
        message: 'Profile already completed.',
        approvalStatus: dbUser.approvalStatus,
        redirectUrl: targetUrl
      }, { status: 200 });

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
    }

    if (role === 'FACULTY') {
      const facultyCount = await prisma.user.count({ where: { role: 'FACULTY' } });
      if (facultyCount >= 15) {
        return NextResponse.json({ message: 'Faculty Coordinator registration limit reached (maximum 15).' }, { status: 400 });
      }
    }

    if (role === 'STUDENT' && rollNo) {
      const existingRollNo = await prisma.student.findUnique({ where: { rollNo } });
      if (existingRollNo && existingRollNo.userId !== dbUser?.id) {
        return NextResponse.json({ message: 'A student with this roll number already exists' }, { status: 409 });
      }
    }

    if (role === 'FACULTY' && employeeId) {
      const existingEmpId = await prisma.faculty.findUnique({ where: { employeeId } });
      if (existingEmpId && existingEmpId.userId !== dbUser?.id) {
        return NextResponse.json({ message: 'A faculty member with this employee ID already exists' }, { status: 409 });
      }
    }

    // Verify department exists
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      return NextResponse.json({ message: 'Selected department does not exist' }, { status: 400 });
    }

    const userName = bodyName || dbUser?.name || email.split('@')[0].toUpperCase();

    await prisma.$transaction(async (tx) => {
      if (!dbUser) {
        dbUser = await tx.user.create({
          data: {
            supabaseUid: supabaseUid || 'google-' + Math.random().toString(36).substring(2, 10),
            email,
            name: userName,
            role,
            approvalStatus: 'PENDING',
            departmentId
          }
        });
      } else {
        dbUser = await tx.user.update({
          where: { id: dbUser.id },
          data: {
            role,
            departmentId,
            ...(userName ? { name: userName } : {})
          }
        });
      }

      if (role === 'STUDENT') {
        await tx.student.upsert({
          where: { userId: dbUser.id },
          update: { rollNo, year: parseInt(year), section, semester: parseInt(semester || 1), departmentId },
          create: { userId: dbUser.id, rollNo, year: parseInt(year), section, semester: parseInt(semester || 1), departmentId }
        });
      } else if (role === 'FACULTY') {
        await tx.faculty.upsert({
          where: { userId: dbUser.id },
          update: { employeeId, designation, departmentId },
          create: { userId: dbUser.id, employeeId, designation, departmentId }
        });
      }
    });

    sendAccountCreatedEmail({ name: dbUser.name, email: dbUser.email, role }).catch(e => console.error(e));

    const targetUrl = dbUser.approvalStatus === 'PENDING' ? '/pending' : (role === 'FACULTY' ? '/faculty/branch' : '/student/events');

    const response = NextResponse.json({
      message: 'Profile completed successfully!',
      approvalStatus: dbUser.approvalStatus,
      redirectUrl: targetUrl
    }, { status: 200 });

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
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ message: 'Error saving profile details' }, { status: 500 });
  }
}
