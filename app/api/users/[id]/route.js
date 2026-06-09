import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { validate, updateUserSchema } from '@/lib/validations';

export const PUT = withAuth(async (req, { params, user }) => {
  try {
    const { dbUser: caller } = user;
    const { id } = params;
    const body = await req.json();
    const { success, data: validated, error: validationError } = validate(updateUserSchema, body);
    if (!success) return NextResponse.json({ message: validationError }, { status: 400 });

    const data = validated;
    const callerRole = caller.role;
    const isCallerAdmin = callerRole === 'ADMIN';
    const isCallerFaculty = callerRole === 'FACULTY';
    const isCallerCoordinator = callerRole === 'STUDENT' && caller.student?.isCoordinator;

    if (!isCallerAdmin && !isCallerFaculty && !isCallerCoordinator) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Admins can manage everything. Non-admins have restricted scopes.
    if (data.isBlocked !== undefined || data.departmentId !== undefined || data.facultyDepartmentId !== undefined) {
      if (!isCallerAdmin) {
        return NextResponse.json({ message: 'Only administrators can block users or assign departments' }, { status: 403 });
      }
    }

    if (!isCallerAdmin) {
      const targetUser = await prisma.user.findUnique({
        where: { id },
        include: { student: true }
      });
      if (!targetUser) return NextResponse.json({ message: 'Target user not found' }, { status: 404 });

      if (targetUser.role !== 'STUDENT' || !targetUser.student) {
        return NextResponse.json({ message: 'Forbidden. You can only manage student volunteer profiles' }, { status: 403 });
      }

      const callerDeptId = isCallerFaculty ? caller.faculty?.departmentId : caller.student?.departmentId;
      if (!callerDeptId || targetUser.student.departmentId !== callerDeptId) {
        return NextResponse.json({ message: 'Forbidden. User belongs to a different department' }, { status: 403 });
      }

      if (isCallerCoordinator) {
        const allowedKeys = ['approvalStatus'];
        if (Object.keys(data).some(k => !allowedKeys.includes(k))) {
          return NextResponse.json({ message: 'Student coordinators are only allowed to update volunteer approval status' }, { status: 403 });
        }
      }

      if (isCallerFaculty) {
        const allowedKeys = ['isCoordinator', 'mentorId', 'approvalStatus'];
        if (Object.keys(data).some(k => !allowedKeys.includes(k))) {
          return NextResponse.json({ message: 'Faculty members are only allowed to update coordinator status, mentor, or approval status' }, { status: 403 });
        }
      }
    }

    if (data.approvalStatus !== undefined) {
      if (!isCallerAdmin && !isCallerCoordinator && !isCallerFaculty) {
        return NextResponse.json({ message: 'Insufficient privileges for approval status change' }, { status: 403 });
      }
    }

    // Update base user details
    const userUpdateData = {};
    if (data.approvalStatus !== undefined) userUpdateData.approvalStatus = data.approvalStatus;
    if (data.isBlocked !== undefined) userUpdateData.isBlocked = data.isBlocked;
    if (data.departmentId !== undefined) userUpdateData.departmentId = data.departmentId;

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({ where: { id }, data: userUpdateData });
    }

    // Student-specific: coordinator promotion, mentor assignment
    if (data.mentorId !== undefined || data.isCoordinator !== undefined) {
      const student = await prisma.student.findUnique({ where: { userId: id } });
      if (student) {
        const studentUpdateData = {};
        if (data.mentorId !== undefined) studentUpdateData.mentorId = data.mentorId === 'null' ? null : data.mentorId;
        if (data.isCoordinator !== undefined) studentUpdateData.isCoordinator = data.isCoordinator;
        await prisma.student.update({ where: { id: student.id }, data: studentUpdateData });
      }
    }

    // Faculty-specific: department/branch assignment
    if (data.facultyDepartmentId !== undefined) {
      const faculty = await prisma.faculty.findUnique({ where: { userId: id } });
      if (faculty) {
        await prisma.faculty.update({
          where: { id: faculty.id },
          data: { departmentId: data.facultyDepartmentId }
        });
      }
    }

    // Fire and forget webhook sync
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (webhookUrl) {
      prisma.user.findUnique({
        where: { id },
        select: { name: true, email: true, role: true, approvalStatus: true, isBlocked: true, createdAt: true }
      }).then(updatedUser => {
        if (updatedUser) {
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...updatedUser, createdAt: updatedUser.createdAt.toISOString() })
          }).catch(err => console.error('Webhook sync failed:', err));
        }
      });
    }

    return NextResponse.json({ message: 'User updated successfully' }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error updating user');
  }
});
