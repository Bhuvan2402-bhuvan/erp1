import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { validate, createDocumentationSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';

const docLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

export const GET = withAuth(async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    // Validate category enum if provided
    const validCategories = ['REPORT', 'CIRCULAR', 'GUIDELINE', 'ARCHIVE'];
    const where = {};
    if (category) {
      if (!validCategories.includes(category)) {
        return NextResponse.json({ message: `Invalid category. Must be one of: ${validCategories.join(', ')}` }, { status: 400 });
      }
      where.category = category;
    }

    const docs = await prisma.documentation.findMany({
      where,
      include: {
        uploadedBy: { select: { name: true, role: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ docs }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching documentation');
  }
});

export const POST = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    
    // Only Admin, Faculty, and Student Coordinators can upload documentation
    const isCallerAdmin = dbUser.role === 'ADMIN';
    const isCallerFaculty = dbUser.role === 'FACULTY';
    const isCallerCoord = dbUser.role === 'STUDENT' && dbUser.student?.isCoordinator;

    if (!isCallerAdmin && !isCallerFaculty && !isCallerCoord) {
      return NextResponse.json({ message: 'Forbidden. Only coordinators, faculty, or admins can upload documentation.' }, { status: 403 });
    }

    // Rate limit: 15 uploads per user per minute
    const { success: withinLimit } = docLimiter.check(15, `doc:${dbUser.id}`);
    if (!withinLimit) {
      return NextResponse.json({ message: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    const body = await req.json();
    const { success, data: validated, error: validationError } = validate(createDocumentationSchema, body);
    if (!success) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const { title, category, description, fileUrl } = validated;

    const doc = await prisma.documentation.create({
      data: {
        title,
        category,
        description: description || null,
        fileUrl,
        uploadedById: dbUser.id
      },
      include: {
        uploadedBy: { select: { name: true, role: true } }
      }
    });

    return NextResponse.json({ message: 'Documentation uploaded successfully', doc }, { status: 201 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error creating documentation');
  }
});

export const DELETE = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    if (dbUser.role !== 'ADMIN' && dbUser.role !== 'FACULTY') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'Document ID required' }, { status: 400 });

    // Verify the document exists before deleting
    const doc = await prisma.documentation.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ message: 'Document not found' }, { status: 404 });

    await prisma.documentation.delete({ where: { id } });
    return NextResponse.json({ message: 'Document deleted successfully' }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error deleting document');
  }
});
