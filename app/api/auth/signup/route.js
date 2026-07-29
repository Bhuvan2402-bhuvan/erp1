import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validate, signupSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';
import { adminAuth } from '@/lib/firebase/admin';

const signupLimiter = rateLimit({ interval: 15 * 60 * 1000, uniqueTokenPerInterval: 500 });

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { success: withinLimit } = signupLimiter.check(5, `signup:${ip}`);
  if (!withinLimit) {
    return NextResponse.json({ message: 'Too many signup attempts. Please try again later.' }, { status: 429 });
  }

  let createdFirebaseUid = null;

  try {
    const body = await req.json();

    const { success, data: validated, error: validationError } = validate(signupSchema, body);
    if (!success) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const {
      email, password, name, role,
      departmentId, rollNo, year, section, semester,
      employeeId, designation, firebaseUid: clientFirebaseUid
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

    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      return NextResponse.json({ message: 'Selected department does not exist' }, { status: 400 });
    }

    let firebaseUid = clientFirebaseUid;
    if (!firebaseUid) {
      try {
        const userRecord = await adminAuth.createUser({
          email,
          password,
          displayName: name,
        });
        firebaseUid = userRecord.uid;
        createdFirebaseUid = firebaseUid;
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-exists') {
          return NextResponse.json({ message: 'An account with this email already exists' }, { status: 409 });
        }
        // Any other Firebase error (quota, config, network) should fail the signup — do not create a ghost account
        console.error('Firebase user creation error:', authErr);
        return NextResponse.json({ message: 'Unable to create authentication account. Please try again later.' }, { status: 503 });
      }
    }

    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          firebaseUid,
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
      message: 'Registration successful! Your account is pending coordinator approval.'
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);

    if (createdFirebaseUid) {
      try {
        await adminAuth.deleteUser(createdFirebaseUid);
      } catch (cleanupErr) {
        console.error('Failed to cleanup Firebase user:', cleanupErr);
      }
    }

    return NextResponse.json({ message: 'An error occurred during signup' }, { status: 500 });
  }
}
