import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';

// PATCH /api/testimonials/[id] — Admin only: update a testimonial
export const PATCH = withAuth(async (req, { params, user }) => {
  try {
    const { dbUser } = user;
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin only' }, { status: 403 });
    }
    const { id } = params;
    const body = await req.json();
    const { name, role, dept, quote, avatar, isVisible, sortOrder } = body;

    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: 'Testimonial not found' }, { status: 404 });

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (dept !== undefined) updateData.dept = dept;
    if (quote !== undefined) updateData.quote = quote;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (isVisible !== undefined) updateData.isVisible = isVisible;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    // Re-generate avatar if name changed but avatar wasn't explicitly set
    if (name !== undefined && avatar === undefined && updateData.name) {
      updateData.avatar = updateData.name.split(' ').slice(0, 2).map(w => w[0].toUpperCase()).join('');
    }

    const testimonial = await prisma.testimonial.update({ where: { id }, data: updateData });
    return NextResponse.json({ message: 'Testimonial updated', testimonial }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error updating testimonial');
  }
});

// DELETE /api/testimonials/[id] — Admin only: delete a testimonial
export const DELETE = withAuth(async (req, { params, user }) => {
  try {
    const { dbUser } = user;
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin only' }, { status: 403 });
    }
    const { id } = params;
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: 'Testimonial not found' }, { status: 404 });

    await prisma.testimonial.delete({ where: { id } });
    return NextResponse.json({ message: 'Testimonial deleted' }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error deleting testimonial');
  }
});
