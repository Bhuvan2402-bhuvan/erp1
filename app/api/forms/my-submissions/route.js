import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser, verifyAccess } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/forms/my-submissions — Student's own form submissions
export async function GET(request) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const skip = (page - 1) * limit;

    // Strictly filter by current user's ID — cannot be manipulated
    const where = { submittedById: dbUser.id };

    const [responses, total] = await Promise.all([
      prisma.formResponse.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          form: {
            select: {
              id: true,
              title: true,
              status: true,
              allowEditing: true,
              department: { select: { id: true, name: true, code: true } },
              createdBy: { select: { name: true } },
            },
          },
          _count: { select: { answers: true } },
        },
      }),
      prisma.formResponse.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      responses,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET /api/forms/my-submissions]', error);
    return NextResponse.json({ message: 'Error fetching submissions' }, { status: 500 });
  }
}
