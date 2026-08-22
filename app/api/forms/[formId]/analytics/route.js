import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser, verifyAccess } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/forms/[formId]/analytics
export async function GET(request, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const canView = dbUser.role === 'ADMIN' || dbUser.role === 'FACULTY' || (dbUser.role === 'STUDENT' && dbUser.student?.isCoordinator);
    if (!canView) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { formId } = params;

    // Check dept access
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: { fields: { where: { isDeleted: false }, orderBy: { sortOrder: 'asc' } } },
    });
    if (!form) return NextResponse.json({ message: 'Form not found' }, { status: 404 });

    if (dbUser.role !== 'ADMIN') {
      const deptId = dbUser.role === 'FACULTY'
        ? (dbUser.faculty?.departmentId || dbUser.departmentId)
        : dbUser.student?.departmentId;
      if (form.departmentId !== deptId) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const [totalResponses, statusBreakdown, submittedByDay, yearBreakdown] = await Promise.all([
      prisma.formResponse.count({ where: { formId } }),
      prisma.formResponse.groupBy({ by: ['status'], where: { formId }, _count: { id: true } }),
      // Responses by day (last 30 days)
      prisma.$queryRaw`
        SELECT DATE(submitted_at) as date, COUNT(*) as count
        FROM form_responses
        WHERE form_id = ${formId}::uuid
          AND submitted_at IS NOT NULL
          AND submitted_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(submitted_at)
        ORDER BY date ASC
      `,
      // Responses by student year
      prisma.$queryRaw`
        SELECT s.year, COUNT(DISTINCT fr.id) as count
        FROM form_responses fr
        JOIN users u ON u.id = fr.submitted_by_id
        JOIN students s ON s."userId" = u.id
        WHERE fr.form_id = ${formId}::uuid
        GROUP BY s.year
        ORDER BY s.year
      `,
    ]);

    // Aggregate answers for choice fields
    const choiceTypes = ['dropdown', 'radio', 'checkbox', 'multi_select', 'yes_no', 'rating'];
    const choiceFields = form.fields.filter(f => choiceTypes.includes(f.fieldType));

    const fieldStats = await Promise.all(
      choiceFields.map(async field => {
        const answers = await prisma.formAnswer.findMany({
          where: { fieldId: field.id, response: { formId, status: { not: 'DRAFT' } } },
          select: { value: true, values: true },
        });
        const tally = {};
        for (const a of answers) {
          const vals = a.values?.length ? a.values : (a.value ? [a.value] : []);
          for (const v of vals) {
            tally[v] = (tally[v] || 0) + 1;
          }
        }
        return { fieldId: field.id, label: field.label, fieldType: field.fieldType, tally };
      })
    );

    const statusMap = {};
    for (const row of statusBreakdown) statusMap[row.status] = row._count.id;

    const submitted = statusMap['SUBMITTED'] || 0;
    const approved = statusMap['APPROVED'] || 0;
    const rejected = statusMap['REJECTED'] || 0;
    const underReview = statusMap['UNDER_REVIEW'] || 0;
    const draft = statusMap['DRAFT'] || 0;

    return NextResponse.json({
      success: true,
      analytics: {
        totalResponses,
        submitted,
        approved,
        rejected,
        underReview,
        draft,
        completionRate: totalResponses > 0 ? Math.round(((totalResponses - draft) / totalResponses) * 100) : 0,
        submissionTrend: submittedByDay,
        yearBreakdown,
        fieldStats,
      },
    });
  } catch (error) {
    console.error('[GET /api/forms/[formId]/analytics]', error);
    return NextResponse.json({ message: 'Error fetching analytics' }, { status: 500 });
  }
}
