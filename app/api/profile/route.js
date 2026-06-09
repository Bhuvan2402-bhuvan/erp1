import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { validate, profileUpdateSchema } from '@/lib/validations';

// GET /api/profile — Return full profile of the logged-in user
export const GET = withAuth(async (req, { user }) => {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.dbUser.id },
      include: {
        student: { include: { department: true } },
        faculty: { include: { department: true } },
      },
    });
    return NextResponse.json({ user: dbUser }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error);
  }
});

// PUT /api/profile — Update own profile (name, phone, bio, avatarUrl)
export const PUT = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    const { success, data: validated, error: validationError } = validate(profileUpdateSchema, body);
    if (!success) return NextResponse.json({ message: validationError }, { status: 400 });

    const allowed = ['name', 'phone', 'bio', 'avatarUrl'];
    const updateData = {};
    for (const key of allowed) {
      if (validated[key] !== undefined) updateData[key] = validated[key];
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.dbUser.id },
      data: updateData,
      include: {
        student: { include: { department: true } },
        faculty: { include: { department: true } },
      },
    });

    return NextResponse.json({ user: updated, message: 'Profile updated successfully' }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error);
  }
});
