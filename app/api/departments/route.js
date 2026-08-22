import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { validate, createDepartmentSchema } from '@/lib/validations';

// GET /api/departments — Public list (used by signup/onboarding)
export async function GET() {
  try {
    let departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { students: true, faculty: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    // Auto-seed default departments if table is empty
    if (departments.length === 0) {
      const defaultDepartments = [
        { name: 'B.Tech - Computer Science and Engineering', code: 'CSE' },
        { name: 'B.Tech - CSE (Artificial Intelligence and Machine Learning)', code: 'CSE-AIML' },
        { name: 'B.Tech - CSE (Artificial Intelligence and Data Science)', code: 'CSE-AIDS' },
        { name: 'B.Tech - CSE (IoT and Cyber Security including Block Chain Technology)', code: 'CSE-IOT' },
        { name: 'B.Tech - Electronics and Communication Engineering', code: 'ECE' },
        { name: 'B.Tech - Electrical and Electronics Engineering', code: 'EEE' },
        { name: 'B.Tech - Mechanical Engineering', code: 'MECH' },
        { name: 'B.Tech - Civil Engineering', code: 'CIVIL' },
        { name: 'BBA', code: 'BBA' },
        { name: 'MBA', code: 'MBA' }
      ];

      for (const dept of defaultDepartments) {
        await prisma.department.upsert({
          where: { code: dept.code },
          update: { name: dept.name },
          create: dept
        });
      }

      departments = await prisma.department.findMany({
        include: {
          _count: {
            select: { students: true, faculty: true }
          }
        },
        orderBy: { name: 'asc' }
      });
    }

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
    // Prisma unique constraint violation (duplicate name or code)
    if (error?.code === 'P2002') {
      const field = error?.meta?.target?.includes('code') ? 'code' : 'name';
      return NextResponse.json({ message: `A department with this ${field} already exists` }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error creating department' }, { status: 500 });
  }
}
