export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';

// PATCH /api/villages/[id] — Admin updates village details or status
export const PATCH = withAuth(async (req, { params, user }) => {
  try {
    const { dbUser } = user;
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin only' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, district, description, departmentId, facultyId, adoptedDate, status } = body;

    const existing = await prisma.adoptedVillage.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: 'Village not found' }, { status: 404 });

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (district !== undefined) updateData.district = district;
    if (description !== undefined) updateData.description = description;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (facultyId !== undefined) updateData.facultyId = facultyId;
    if (adoptedDate !== undefined) updateData.adoptedDate = new Date(adoptedDate);
    if (status !== undefined) updateData.status = status;

    const village = await prisma.adoptedVillage.update({
      where: { id },
      data: updateData,
      include: {
        department: { select: { id: true, name: true, code: true } },
        faculty: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      }
    });

    return NextResponse.json({ message: 'Village updated', village }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error updating village');
  }
});

// DELETE /api/villages/[id] — Admin deletes a village assignment
export const DELETE = withAuth(async (req, { params, user }) => {
  try {
    const { dbUser } = user;
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin only' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.adoptedVillage.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: 'Village not found' }, { status: 404 });

    await prisma.adoptedVillage.delete({ where: { id } });

    return NextResponse.json({ message: 'Village deleted' }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error deleting village');
  }
});
