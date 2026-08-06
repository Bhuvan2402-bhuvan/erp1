import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';

// GET /api/testimonials — Public: fetch all visible testimonials (or all if ?all=1)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get('all') === '1';
    const where = showAll ? {} : { isVisible: true };

    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json({ testimonials }, {
      status: 200,
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
    });
  } catch (error) {
    return NextResponse.json({ testimonials: [] }, { status: 200 });
  }
}


// POST /api/testimonials — Admin only: create a testimonial
export const POST = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin only' }, { status: 403 });
    }
    const body = await req.json();
    const { name, role, dept, quote, avatar, isVisible, sortOrder } = body;

    if (!name || !role || !dept || !quote) {
      return NextResponse.json({ message: 'name, role, dept, and quote are required' }, { status: 400 });
    }

    // Auto-generate avatar initials if not provided
    const initials = avatar || name.split(' ').slice(0, 2).map(w => w[0].toUpperCase()).join('');

    const testimonial = await prisma.testimonial.create({
      data: {
        name,
        role,
        dept,
        quote,
        avatar: initials,
        isVisible: isVisible !== false,
        sortOrder: sortOrder ?? 0,
      }
    });

    return NextResponse.json({ message: 'Testimonial created', testimonial }, { status: 201 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error creating testimonial');
  }
});
