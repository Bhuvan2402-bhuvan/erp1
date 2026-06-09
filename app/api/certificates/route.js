import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';
import { validate, createCertificateSchema } from '@/lib/validations';

// GET /api/certificates — List certificates (own or all for admin/faculty)
export async function GET(req) {
  try {
    const userCtx = await getUser();
    if (!userCtx || !userCtx.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { dbUser } = userCtx;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    let where = {};
    if (dbUser.role === 'STUDENT') {
      if (!dbUser.student?.id) {
        return NextResponse.json({ certificates: [] }, { status: 200 }); // No profile = no certificates
      }
      where.studentId = dbUser.student.id;
    } else if (studentId) {
      where.studentId = studentId;
    }

    const certificates = await prisma.certificate.findMany({
      where,
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ certificates }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching certificates' }, { status: 500 });
  }
}

// POST /api/certificates — Upload certificate
export async function POST(req) {
  try {
    const userCtx = await getUser();
    if (!userCtx || !userCtx.dbUser || !userCtx.dbUser.student) {
      return NextResponse.json({ message: 'Only students can upload certificates' }, { status: 403 });
    }

    const body = await req.json();
    const { success, data: validated, error: validationError } = validate(createCertificateSchema, body);
    
    if (!success) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const { title, description, fileUrl } = validated;

    const cert = await prisma.certificate.create({
      data: {
        studentId: userCtx.dbUser.student.id,
        title,
        description,
        fileUrl
      }
    });

    return NextResponse.json({ message: 'Certificate uploaded', certificate: cert }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error uploading certificate' }, { status: 500 });
  }
}
