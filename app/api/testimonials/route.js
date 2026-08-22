import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';
import { testimonialSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

// GET /api/testimonials — Retrieve all testimonials (including invisible ones for managers)
export async function GET(request) {
  try {
    const userContext = await getUser();
    if (!userContext || !userContext.dbUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { dbUser } = userContext;

    // Access protection
    if (dbUser.isBlocked) {
      return NextResponse.json({ success: false, message: 'Account is blocked' }, { status: 403 });
    }
    if (dbUser.approvalStatus !== 'APPROVED' && dbUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Account pending approval' }, { status: 403 });
    }

    const isCoordinator = dbUser.student?.isCoordinator;
    const isManager = dbUser.role === 'ADMIN' || dbUser.role === 'FACULTY' || isCoordinator;

    const where = {};
    if (!isManager) {
      where.isVisible = true;
    }

    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ success: true, testimonials });
  } catch (error) {
    console.error('[GET /api/testimonials]', error);
    return NextResponse.json({ success: false, message: 'Error fetching testimonials' }, { status: 500 });
  }
}

// POST /api/testimonials — Add testimonial (Admins/Faculty/Coordinators)
export async function POST(request) {
  try {
    const userContext = await getUser();
    if (!userContext || !userContext.dbUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { dbUser } = userContext;

    // Access protection
    if (dbUser.isBlocked) {
      return NextResponse.json({ success: false, message: 'Account is blocked' }, { status: 403 });
    }
    if (dbUser.approvalStatus !== 'APPROVED' && dbUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Account pending approval' }, { status: 403 });
    }

    const isCoordinator = dbUser.student?.isCoordinator;
    const isManager = dbUser.role === 'ADMIN' || dbUser.role === 'FACULTY' || isCoordinator;

    if (!isManager) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = testimonialSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      }, { status: 400 });
    }

    const { name, role, dept, quote, avatar, isVisible, sortOrder } = validation.data;

    const testimonial = await prisma.testimonial.create({
      data: {
        name,
        role,
        dept,
        quote,
        avatar,
        isVisible: isVisible !== undefined ? isVisible : true,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0
      }
    });

    return NextResponse.json({ success: true, message: 'Testimonial created successfully', testimonial }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/testimonials]', error);
    return NextResponse.json({ success: false, message: 'Error creating testimonial' }, { status: 500 });
  }
}
