import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';
import { financeRecordSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

// GET /api/finance — List finance records
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
    const departmentId = searchParams.get('departmentId');
    const type = searchParams.get('type'); // INCOME / EXPENSE

    const where = {};
    if (departmentId) where.departmentId = departmentId;
    if (type) where.type = type;

    // Scoped visibility: Faculty only sees their department budget/expenses
    if (dbUser.role === 'FACULTY') {
      if (dbUser.faculty?.departmentId) {
        where.departmentId = dbUser.faculty.departmentId;
      }
    } else if (dbUser.role === 'STUDENT') {
      if (dbUser.student?.isCoordinator) {
        where.departmentId = dbUser.student.departmentId;
      } else {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
    }

    const records = await prisma.financeRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true, role: true } },
        department: { select: { name: true, code: true } }
      }
    });

    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error('[GET /api/finance]', error);
    return NextResponse.json({ success: false, message: 'Error fetching finance records' }, { status: 500 });
  }
}

// POST /api/finance — Add finance record (Admins/Faculty/Coordinators)
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
    const validation = financeRecordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      }, { status: 400 });
    }

    const { title, amount, type, category, description, receiptUrl, departmentId } = validation.data;

    // Coordinators can only post to their own department
    let targetDepartmentId = departmentId || null;
    if (dbUser.role === 'STUDENT' && isCoordinator) {
      targetDepartmentId = dbUser.student.departmentId;
    } else if (dbUser.role === 'FACULTY') {
      targetDepartmentId = dbUser.faculty.departmentId || departmentId || null;
    }

    const record = await prisma.financeRecord.create({
      data: {
        title,
        amount: parseFloat(amount),
        type,
        category,
        description,
        receiptUrl,
        departmentId: targetDepartmentId,
        createdById: dbUser.id
      }
    });

    return NextResponse.json({ success: true, message: 'Finance record created successfully', record }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/finance]', error);
    return NextResponse.json({ success: false, message: 'Error adding finance record' }, { status: 500 });
  }
}

// DELETE /api/finance — Delete finance record (Admins only)
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

    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Only admins can delete finance records' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID query param is required' }, { status: 400 });
    }

    await prisma.financeRecord.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Finance record deleted successfully' });
  } catch (error) {
    console.error('[DELETE /api/finance]', error);
    return NextResponse.json({ success: false, message: 'Error deleting finance record' }, { status: 500 });
  }
}
