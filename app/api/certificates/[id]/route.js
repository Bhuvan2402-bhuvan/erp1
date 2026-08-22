import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// DELETE /api/certificates/:id — Delete certificate
export async function DELETE(request, { params }) {
  try {
    const userContext = await getUser();
    if (!userContext || !userContext.dbUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { dbUser } = userContext;
    const { id } = params;

    // Access protection
    if (dbUser.isBlocked) {
      return NextResponse.json({ success: false, message: 'Account is blocked' }, { status: 403 });
    }
    if (dbUser.approvalStatus !== 'APPROVED' && dbUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Account pending approval' }, { status: 403 });
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: { student: true }
    });

    if (!certificate) {
      return NextResponse.json({ success: false, message: 'Certificate not found' }, { status: 404 });
    }

    const isCoordinator = dbUser.student?.isCoordinator;
    const isManager = dbUser.role === 'ADMIN' || dbUser.role === 'FACULTY' || isCoordinator;

    if (!isManager) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await prisma.certificate.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error('[DELETE /api/certificates/:id]', error);
    return NextResponse.json({ success: false, message: 'Error deleting certificate' }, { status: 500 });
  }
}
