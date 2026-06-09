import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import prisma from '@/lib/prisma';
import { validate, signupSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';

const signupLimiter = rateLimit({ interval: 15 * 60 * 1000, uniqueTokenPerInterval: 500 });

export async function POST(req) {
  // Rate limit: 5 signup attempts per IP per 15 minutes
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { success: withinLimit } = signupLimiter.check(5, `signup:${ip}`);
  if (!withinLimit) {
    return NextResponse.json({ message: 'Too many signup attempts. Please try again later.' }, { status: 429 });
  }

  let supabaseAuthId = null;

  try {
    const body = await req.json();

    // 1. Validate input (blocks ADMIN self-assignment via enum restriction)
    const { success, data: validated, error: validationError } = validate(signupSchema, body);
    if (!success) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const {
      email, password, name, role,
      departmentId, rollNo, year, section, semester,
      employeeId, designation
    } = validated;

    // 2. Pre-check for duplicate unique fields before creating Supabase user
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

    // 3. Verify department exists
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      return NextResponse.json({ message: 'Selected department does not exist' }, { status: 400 });
    }

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin') || 'http://localhost:3000';

    // 4. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${siteUrl}/api/auth/callback`
      }
    });

    if (authError) {
      return NextResponse.json({ message: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ message: 'Failed to create auth user' }, { status: 500 });
    }

    supabaseAuthId = authData.user.id;

    // 5. Create the user in Prisma (transaction for consistency)
    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          supabaseAuthId,
          email,
          name,
          role,
          approvalStatus: 'PENDING',
          departmentId
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
            departmentId
          }
        });
      } else if (role === 'FACULTY') {
        await tx.faculty.create({
          data: {
            userId: newUser.id,
            employeeId,
            designation,
            departmentId
          }
        });
      }
    });

    // Fire and forget webhook to Google Sheets
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

    return NextResponse.json({
      message: 'Registration successful! A verification link has been sent to your email. Please check your inbox (and spam folder) to verify your account.'
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);

    // Clean up orphan Supabase user if Prisma transaction failed
    if (supabaseAuthId) {
      try {
        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );
        await supabaseAdmin.auth.admin.deleteUser(supabaseAuthId);
        console.log('Cleaned up orphan Supabase user:', supabaseAuthId);
      } catch (cleanupErr) {
        console.error('Failed to cleanup Supabase user:', cleanupErr);
      }
    }

    return NextResponse.json({ message: 'An error occurred during signup' }, { status: 500 });
  }
}
