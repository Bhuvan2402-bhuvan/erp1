import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { validate, createDepartmentSchema } from '@/lib/validations';

// GET /api/departments — Public list (used by signup/onboarding)
export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { students: true, faculty: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json({ departments }, { 
      status: 200,
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching departments' }, { status: 500 });
  }
}

// POST /api/departments — Create department (admin only)
export async function POST(req) {
  try {
    const auth = await requireRole(['ADMIN']);
    if (!auth.authorized) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { success, data: validated, error: validationError } = validate(createDepartmentSchema, body);
    if (!success) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const { name, code } = validated;
    
    const newDept = await prisma.department.create({
      data: { name, code }
    });
    
    return NextResponse.json({ message: 'Department created', department: newDept }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error creating department' }, { status: 500 });
  }
}
