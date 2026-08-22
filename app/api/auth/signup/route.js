import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validate, signupSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendAccountCreatedEmail } from '@/lib/email';
import { DEFAULT_DEPARTMENTS } from '@/lib/constants';

const signupLimiter = rateLimit({ interval: 15 * 60 * 1000, uniqueTokenPerInterval: 500 });

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { success: withinLimit } = signupLimiter.check(5, `signup:${ip}`);
  if (!withinLimit) {
    return NextResponse.json({ message: 'Too many signup attempts. Please try again later.' }, { status: 429 });
  }

  let createdSupabaseUid = null;

  try {
    const body = await req.json();

    const { success, data: validated, error: validationError } = validate(signupSchema, body);
    if (!success) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const {
      email, password, name, role,
      departmentId, rollNo, year, section, semester,
      employeeId, designation, supabaseUid: clientSupabaseUid
    } = validated;

    if (role === 'FACULTY') {
      const facultyCount = await prisma.user.count({ where: { role: 'FACULTY' } });
      if (facultyCount >= 15) {
        return NextResponse.json({ message: 'Faculty Coordinator registration limit reached (maximum 15 accounts allowed).' }, { status: 400 });
      }
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ message: 'An account with this email already exists' }, { status: 409 });
    }

    if (role === 'STUDENT' && rollNo) {
      const existingRollNo = await prisma.student.findUnique({ where: { rollNo } });
      if (existingRollNo) {
        return NextResponse.json({ message: 'A student with this roll number already exists' }, { status: 409 });
      }
    }

    if (role === 'FACULTY' && employeeId) {
      const existingEmpId = await prisma.faculty.findUnique({ where: { employeeId } });
      if (existingEmpId) {
        return NextResponse.json({ message: 'A faculty member with this employee ID already exists' }, { status: 409 });
      }
    }

    let dept = await prisma.department.findFirst({
      where: {
        OR: [
          { id: departmentId },
          { code: departmentId.toUpperCase() },
          { name: departmentId }
        ]
      }
    });

    if (!dept) {
      const defaultDept = DEFAULT_DEPARTMENTS.find(d => d.id === departmentId || d.code === departmentId.toUpperCase());
      if (defaultDept) {
        dept = await prisma.department.upsert({
          where: { code: defaultDept.code },
          update: { name: defaultDept.name },
          create: { name: defaultDept.name, code: defaultDept.code }
        });
      } else {
        return NextResponse.json({ message: 'Selected department does not exist' }, { status: 400 });
      }
    }

    const resolvedDepartmentId = dept.id;

    let supabaseUid = clientSupabaseUid;
    if (!supabaseUid) {
      try {
        const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name, role }
        });
        if (authErr || !authUser?.user) {
          throw authErr || new Error('Failed to create Supabase user');
        }
        supabaseUid = authUser.user.id;
        createdSupabaseUid = supabaseUid;
      } catch (authErr) {
        console.error('Supabase user creation error:', authErr);
        return NextResponse.json({ message: 'Unable to create authentication account. Please try again later.' }, { status: 503 });
      }
    }

    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          supabaseUid,
          email,
          name,
          role,
          approvalStatus: 'PENDING',
          departmentId: resolvedDepartmentId
        }
      });

      if (role === 'STUDENT') {
        await tx.student.create({
          data: {
            userId: newUser.id,
            rollNo,
            year: parseInt(year),
            section,
            semester: parseInt(semester || 1),
            departmentId: resolvedDepartmentId
          }
        });
      } else if (role === 'FACULTY') {
        await tx.faculty.create({
          data: {
            userId: newUser.id,
            employeeId,
            designation,
            departmentId: resolvedDepartmentId
          }
        });
      }
    });

    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          role,
          approvalStatus: 'PENDING',
          isBlocked: false,
          createdAt: new Date().toISOString()
        })
      }).catch(err => console.error('Webhook sync failed:', err));
    }

    // Send account creation confirmation email
    sendAccountCreatedEmail({ name, email, role }).catch(err => console.error('Failed sending account confirmation:', err));

    return NextResponse.json({
      message: 'Registration successful! Your account is pending coordinator approval.'
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);

    if (createdSupabaseUid) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(createdSupabaseUid);
      } catch (cleanupErr) {
        console.error('Failed to cleanup Supabase user:', cleanupErr);
      }
    }

    return NextResponse.json({ message: 'An error occurred during signup' }, { status: 500 });
  }
}
