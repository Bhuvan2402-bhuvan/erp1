import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser, verifyAccess } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

function canManageForms(dbUser) {
  if (dbUser.role === 'ADMIN') return true;
  if (dbUser.role === 'FACULTY') return true;
  if (dbUser.role === 'STUDENT' && dbUser.student?.isCoordinator) return true;
  return false;
}

async function checkFormAccessForResponses(dbUser, formId) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { department: true },
  });
  if (!form) return { allowed: false, form: null };
  if (dbUser.role === 'ADMIN') return { allowed: true, form };
  if (dbUser.role === 'FACULTY') {
    const deptId = dbUser.faculty?.departmentId || dbUser.departmentId;
    return { allowed: form.departmentId === deptId, form };
  }
  if (dbUser.role === 'STUDENT' && dbUser.student?.isCoordinator) {
    return { allowed: form.departmentId === dbUser.student?.departmentId, form };
  }
  return { allowed: false, form };
}

// GET /api/forms/[formId]/responses — Faculty: list all responses; Student: get own
export async function GET(request, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const { formId } = params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';

    if (canManageForms(dbUser)) {
      // Faculty/Admin view — all responses for this form in their dept
      const { allowed, form } = await checkFormAccessForResponses(dbUser, formId);
      if (!form) return NextResponse.json({ message: 'Form not found' }, { status: 404 });
      if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

      const where = { formId };
      if (status) where.status = status;
      if (search) {
        where.submittedBy = {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { student: { rollNo: { contains: search, mode: 'insensitive' } } },
          ],
        };
      }

      const [responses, total] = await Promise.all([
        prisma.formResponse.findMany({
          where,
          skip,
          take: limit,
          orderBy: { submittedAt: 'desc' },
          include: {
            submittedBy: {
              select: {
                id: true, name: true, email: true,
                student: { select: { rollNo: true, year: true, section: true, department: { select: { code: true } } } },
              },
            },
            _count: { select: { answers: true, notes: true } },
          },
        }),
        prisma.formResponse.count({ where }),
      ]);

      return NextResponse.json({ success: true, responses, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } else {
      // Student: return only their own response
      const response = await prisma.formResponse.findUnique({
        where: { formId_submittedById: { formId, submittedById: dbUser.id } },
        include: { answers: true },
      });
      return NextResponse.json({ success: true, response: response || null });
    }
  } catch (error) {
    console.error('[GET /api/forms/[formId]/responses]', error);
    return NextResponse.json({ message: 'Error fetching responses' }, { status: 500 });
  }
}

// POST /api/forms/[formId]/responses — Student submits or saves draft
export async function POST(request, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const { formId } = params;
    const body = await request.json();
    const { answers, isDraft } = body;

    // Fetch form with fields
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: { fields: { where: { isDeleted: false }, orderBy: { sortOrder: 'asc' } } },
    });
    if (!form) return NextResponse.json({ message: 'Form not found' }, { status: 404 });
    if (form.status !== 'PUBLISHED') return NextResponse.json({ message: 'Form is not accepting submissions' }, { status: 400 });

    // Check deadline
    if (form.endsAt && new Date() > new Date(form.endsAt)) {
      return NextResponse.json({ message: 'Form deadline has passed' }, { status: 400 });
    }

    // Check max responses
    if (form.maxResponses) {
      const count = await prisma.formResponse.count({ where: { formId, status: { not: 'DRAFT' } } });
      if (count >= form.maxResponses) return NextResponse.json({ message: 'Maximum responses reached' }, { status: 400 });
    }

    // Check student eligibility
    if (dbUser.role === 'STUDENT' && !dbUser.student?.isCoordinator) {
      const eligible = await checkStudentFormEligibility(dbUser, form);
      if (!eligible) return NextResponse.json({ message: 'You are not eligible to fill this form' }, { status: 403 });
    }

    // Check duplicate submission
    const existing = await prisma.formResponse.findUnique({
      where: { formId_submittedById: { formId, submittedById: dbUser.id } },
    });
    if (existing && existing.status !== 'DRAFT') {
      if (!form.allowMultipleSubmissions) {
        return NextResponse.json({ message: 'You have already submitted this form' }, { status: 400 });
      }
    }

    // Validate required fields (skip for draft)
    if (!isDraft) {
      for (const field of form.fields) {
        if (!field.required) continue;
        const answer = answers?.find(a => a.fieldId === field.id);
        if (!answer || (answer.value === undefined && !answer.values?.length)) {
          return NextResponse.json({ message: `Required field "${field.label}" is missing` }, { status: 400 });
        }
      }
    }

    const newStatus = isDraft ? 'DRAFT' : 'SUBMITTED';
    const submittedAt = isDraft ? null : new Date();

    let response;
    if (existing) {
      // Update existing draft
      if (!form.allowEditing && existing.status === 'SUBMITTED') {
        return NextResponse.json({ message: 'Editing after submission is not allowed' }, { status: 400 });
      }
      response = await prisma.formResponse.update({
        where: { id: existing.id },
        data: { status: newStatus, submittedAt },
      });
      // Upsert answers
      await upsertAnswers(response.id, answers || []);
    } else {
      response = await prisma.formResponse.create({
        data: { formId, submittedById: dbUser.id, status: newStatus, submittedAt },
      });
      await upsertAnswers(response.id, answers || []);
    }

    if (!isDraft) {
      await prisma.formAuditLog.create({
        data: { formId, userId: dbUser.id, action: 'response_submitted', metadata: { responseId: response.id } },
      }).catch(() => {});

      // Notify faculty if enabled
      if (form.notifyOnSubmission) {
        notifyFacultyOnSubmission(form, dbUser, response).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, response, isDraft });
  } catch (error) {
    console.error('[POST /api/forms/[formId]/responses]', error);
    return NextResponse.json({ message: 'Error submitting form' }, { status: 500 });
  }
}

async function upsertAnswers(responseId, answers) {
  for (const answer of answers) {
    if (!answer.fieldId) continue;
    await prisma.formAnswer.upsert({
      where: { responseId_fieldId: { responseId, fieldId: answer.fieldId } },
      create: {
        responseId,
        fieldId: answer.fieldId,
        value: answer.value ?? null,
        values: answer.values ?? null,
        fileUrl: answer.fileUrl ?? null,
      },
      update: {
        value: answer.value ?? null,
        values: answer.values ?? null,
        fileUrl: answer.fileUrl ?? null,
      },
    });
  }
}

async function checkStudentFormEligibility(dbUser, form) {
  if (form.visibility === 'ALL_VOLUNTEERS') return true;
  if (form.visibility === 'DEPARTMENT_ONLY') {
    return dbUser.student?.departmentId === form.departmentId;
  }
  if (form.visibility === 'SELECTED_DEPARTMENTS') {
    const fa = await prisma.formAccess.findFirst({
      where: { formId: form.id, departmentId: dbUser.student?.departmentId },
    });
    return !!fa;
  }
  if (form.visibility === 'SELECTED_USERS') {
    const fa = await prisma.formAccess.findFirst({
      where: { formId: form.id, userId: dbUser.id },
    });
    return !!fa;
  }
  return false;
}

async function notifyFacultyOnSubmission(form, student, response) {
  const faculty = await prisma.user.findMany({
    where: {
      role: 'FACULTY',
      faculty: { departmentId: form.departmentId },
      approvalStatus: 'APPROVED',
      isBlocked: false,
    },
    select: { id: true },
  });
  if (!faculty.length) return;
  await prisma.notification.createMany({
    data: faculty.map(f => ({
      userId: f.id,
      title: 'New Form Submission',
      message: `${student.name} submitted "${form.title}"`,
      type: 'INFO',
    })),
    skipDuplicates: true,
  });
}
