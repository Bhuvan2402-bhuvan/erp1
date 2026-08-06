import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';

// PATCH /api/faculty-desk/[id] — Admin only: update a profile
export const PATCH = withAuth(async (req, { params, user }) => {
  try {
    const { dbUser } = user;
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin only' }, { status: 403 });
    }
    const { id } = params;
    const body = await req.json();

    const existing = await prisma.facultyDesk.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: 'Profile not found' }, { status: 404 });

    const updateData = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.role !== undefined) updateData.role = body.role === 'NSS_PC' ? 'NSS_PC' : 'NSS_PO';
    if (body.designation !== undefined) updateData.designation = body.designation;
    if (body.branch !== undefined) updateData.branch = body.branch;
    if (body.foreword !== undefined) updateData.foreword = body.foreword;
    if (body.photoUrl !== undefined) updateData.photoUrl = body.photoUrl || null;
    if (body.sortOrder !== undefined) updateData.sortOrder = Number(body.sortOrder) || 0;
    if (body.isVisible !== undefined) updateData.isVisible = Boolean(body.isVisible);
    if (body.achievements !== undefined && Array.isArray(body.achievements)) {
      updateData.achievements = body.achievements.filter(a => typeof a === 'string' && a.trim().length > 0);
    }

    const profile = await prisma.facultyDesk.update({ where: { id }, data: updateData });
    return NextResponse.json({ message: 'Faculty desk profile updated', profile }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error updating faculty desk profile');
  }
});

// DELETE /api/faculty-desk/[id] — Admin only: delete a profile
export const DELETE = withAuth(async (req, { params, user }) => {
  try {
    const { dbUser } = user;
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin only' }, { status: 403 });
    }
    const { id } = params;
    const existing = await prisma.facultyDesk.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: 'Profile not found' }, { status: 404 });

    await prisma.facultyDesk.delete({ where: { id } });
    return NextResponse.json({ message: 'Faculty desk profile deleted' }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error deleting faculty desk profile');
  }
});
