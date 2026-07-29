import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { validate, createCertificateSchema } from '@/lib/validations';

// GET /api/certificates — List certificates (own or scoped for admin/faculty)
export const GET = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    let where = {};
    if (dbUser.role === 'STUDENT') {
      if (!dbUser.student?.id) {
        return NextResponse.json({ certificates: [] }, { status: 200 }); // No profile = no certificates
      }
      where.studentId = dbUser.student.id;
    } else if (dbUser.role === 'FACULTY') {
      // Faculty can only see certificates from students in their department
      const facultyDeptId = dbUser.faculty?.departmentId;
      if (studentId) {
        // Verify the requested student belongs to the faculty's department
        const targetStudent = await prisma.student.findUnique({ where: { id: studentId } });
        if (!targetStudent || targetStudent.departmentId !== facultyDeptId) {
          return NextResponse.json({ message: 'Forbidden. Student is not in your department.' }, { status: 403 });
        }
        where.studentId = studentId;
      } else {
        // Return all certificates from students in the faculty's department
        where.student = { departmentId: facultyDeptId };
      }
    } else if (dbUser.role === 'ADMIN') {
      // Admins can see all, optionally filtered by studentId
      if (studentId) {
        where.studentId = studentId;
      }
    }

    const certificates = await prisma.certificate.findMany({
      where,
      include: { student: { include: { user: { select: { name: true } }, department: { select: { name: true, code: true } } } } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ certificates }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching certificates');
  }
});

// POST /api/certificates — Upload certificate (students only)
export const POST = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    if (!dbUser.student) {
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
        studentId: dbUser.student.id,
        title,
        description,
        fileUrl
      }
    });

    return NextResponse.json({ message: 'Certificate uploaded', certificate: cert }, { status: 201 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error uploading certificate');
  }
});
