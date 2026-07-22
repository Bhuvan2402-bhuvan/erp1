import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth-helpers';

// GET /api/chat/contacts — Get chat-eligible users based on role
export async function GET(req) {
  try {
    const userCtx = await getUser();
    if (!userCtx || !userCtx.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { dbUser } = userCtx;
    let contacts = [];

    const userSelect = {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      department: { select: { name: true, code: true } },
      student: { select: { isCoordinator: true } }
    };

    if (dbUser.role === 'ADMIN') {
      // Admins can see everyone
      contacts = await prisma.user.findMany({
        where: { id: { not: dbUser.id } },
        select: userSelect,
        orderBy: { name: 'asc' }
      });
    } else if (dbUser.role === 'FACULTY') {
      // Faculty can see students in their department and admins
      const facultyDeptId = dbUser.faculty?.departmentId;
      contacts = await prisma.user.findMany({
        where: {
          id: { not: dbUser.id },
          OR: [
            { role: 'ADMIN' },
            { student: { departmentId: facultyDeptId } }
          ]
        },
        select: userSelect,
        orderBy: { name: 'asc' }
      });
    } else if (dbUser.role === 'STUDENT') {
      // Students can see faculty in their department, admins, and coordinators
      const studentDeptId = dbUser.student?.departmentId;
      contacts = await prisma.user.findMany({
        where: {
          id: { not: dbUser.id },
          OR: [
            { role: 'ADMIN' },
            { faculty: { departmentId: studentDeptId } },
            { student: { isCoordinator: true } }
          ]
        },
        select: userSelect,
        orderBy: { name: 'asc' }
      });
    }

    const formattedContacts = contacts.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      role: c.student?.isCoordinator ? 'COORDINATOR' : c.role,
      avatarUrl: c.avatarUrl,
      dept: c.department?.code || c.department?.name || 'General'
    }));

    return NextResponse.json({ contacts: formattedContacts }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching contacts' }, { status: 500 });
  }
}
