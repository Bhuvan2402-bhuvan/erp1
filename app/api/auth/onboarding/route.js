import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';
import { validate, onboardingSchema } from '@/lib/validations';

export async function POST(req) {
  try {
    const userCtx = await getUser();
    if (!userCtx || !userCtx.dbUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { dbUser } = userCtx;

    // Prevent re-onboarding if user already has a role profile
    if (dbUser.student || dbUser.faculty) {
      return NextResponse.json({ message: 'Profile already completed. Re-onboarding is not allowed.' }, { status: 409 });
    }

    const body = await req.json();
    const { success, data: validated, error: validationError } = validate(onboardingSchema, body);
    
    if (!success) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const { role, departmentId, rollNo, year, section, semester, employeeId, designation } = validated;

    // Enforce quota limits (same as signup)
    if (role === 'FACULTY') {
      const facultyCount = await prisma.user.count({ where: { role: 'FACULTY' } });
      if (facultyCount >= 15) {
        return NextResponse.json({ message: 'Faculty Coordinator registration limit reached (maximum 15).' }, { status: 400 });
      }
    }

    // Verify department exists
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      return NextResponse.json({ message: 'Selected department does not exist' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Update base user
      await tx.user.update({
        where: { id: dbUser.id },
        data: {
          role,
          departmentId
        }
      });

      if (role === 'STUDENT') {
        // Create or update student record
        await tx.student.upsert({
          where: { userId: dbUser.id },
          update: { rollNo, year: parseInt(year), section, semester: parseInt(semester || 1), departmentId },
          create: { userId: dbUser.id, rollNo, year: parseInt(year), section, semester: parseInt(semester || 1), departmentId }
        });
      } else if (role === 'FACULTY') {
        // Create or update faculty record
        await tx.faculty.upsert({
          where: { userId: dbUser.id },
          update: { employeeId, designation, departmentId },
          create: { userId: dbUser.id, employeeId, designation, departmentId }
        });
      }
    });

    return NextResponse.json({ message: 'Profile completed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ message: 'Error saving profile details' }, { status: 500 });
  }
}
