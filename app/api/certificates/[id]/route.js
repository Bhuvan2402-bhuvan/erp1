import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser, verifyAccess } from '@/lib/auth-helpers';
import { sanitizeErrorResponse } from '@/lib/api-helpers';

// DELETE /api/certificates/[id] — Delete certificate
export async function DELETE(req, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx || !userCtx.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const access = verifyAccess(userCtx.dbUser);
    if (!access.authorized) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const cert = await prisma.certificate.findUnique({ where: { id: params.id } });
    if (!cert) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    // Only owner or admin can delete
    if (userCtx.dbUser.role !== 'ADMIN' && cert.studentId !== userCtx.dbUser.student?.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await prisma.certificate.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Certificate deleted' }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error deleting certificate');
  }
}
