import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';
import { documentationSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

// GET /api/documentation — List documentation files
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // e.g., REPORT, CIRCULAR

    const where = {};
    if (category) where.category = category;

    const docs = await prisma.documentation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { uploadedBy: { select: { name: true, role: true } } }
    });

    return NextResponse.json({ success: true, documentations: docs });
  } catch (error) {
    console.error('[GET /api/documentation]', error);
    return NextResponse.json({ success: false, message: 'Error fetching documents' }, { status: 500 });
  }
}

// POST /api/documentation — Upload document metadata (Admins/Faculty/Coordinators)
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
    const validation = documentationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      }, { status: 400 });
    }

    const { title, category, description, fileUrl } = validation.data;

    const doc = await prisma.documentation.create({
      data: {
        title,
        category,
        description,
        fileUrl,
        uploadedById: dbUser.id
      }
    });

    return NextResponse.json({ success: true, message: 'Document added successfully', documentation: doc }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/documentation]', error);
    return NextResponse.json({ success: false, message: 'Error adding document' }, { status: 500 });
  }
}

// DELETE /api/documentation — Delete document (Admins/Faculty/Coordinators)
export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID query param is required' }, { status: 400 });
    }

    const doc = await prisma.documentation.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    }

    const isUploader = doc.uploadedById === dbUser.id;
    const isManager = dbUser.role === 'ADMIN' || dbUser.role === 'FACULTY' || dbUser.student?.isCoordinator;
    if (!isUploader && !isManager) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await prisma.documentation.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('[DELETE /api/documentation]', error);
    return NextResponse.json({ success: false, message: 'Error deleting document' }, { status: 500 });
  }
}
