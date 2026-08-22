import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser, verifyAccess } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// GET /api/forms/[formId]/export?format=csv|xlsx
export async function GET(request, { params }) {
  try {
    const userCtx = await getUser();
    if (!userCtx?.dbUser) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { dbUser } = userCtx;
    const access = verifyAccess(dbUser);
    if (!access.authorized) return NextResponse.json({ message: access.reason }, { status: 403 });

    const canExport = dbUser.role === 'ADMIN' || dbUser.role === 'FACULTY' || (dbUser.role === 'STUDENT' && dbUser.student?.isCoordinator);
    if (!canExport) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { formId } = params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: { fields: { where: { isDeleted: false }, orderBy: { sortOrder: 'asc' } } },
    });
    if (!form) return NextResponse.json({ message: 'Form not found' }, { status: 404 });

    // Dept check
    if (dbUser.role !== 'ADMIN') {
      const deptId = dbUser.role === 'FACULTY'
        ? (dbUser.faculty?.departmentId || dbUser.departmentId)
        : dbUser.student?.departmentId;
      if (form.departmentId !== deptId) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const responses = await prisma.formResponse.findMany({
      where: { formId, status: { not: 'DRAFT' } },
      include: {
        submittedBy: {
          select: {
            name: true, email: true,
            student: { select: { rollNo: true, year: true, section: true } },
          },
        },
        answers: true,
      },
      orderBy: { submittedAt: 'asc' },
    });

    // Build rows
    const headers = ['Name', 'Email', 'Roll No', 'Year', 'Section', 'Submitted At', 'Status',
      ...form.fields.map(f => f.label)];

    const rows = responses.map(r => {
      const answerMap = {};
      for (const a of r.answers) {
        const value = a.values?.length ? (Array.isArray(a.values) ? a.values.join(', ') : a.values) : (a.value || '');
        answerMap[a.fieldId] = value;
      }
      return [
        r.submittedBy.name,
        r.submittedBy.email,
        r.submittedBy.student?.rollNo || '',
        r.submittedBy.student?.year || '',
        r.submittedBy.student?.section || '',
        r.submittedAt ? new Date(r.submittedAt).toISOString() : '',
        r.status,
        ...form.fields.map(f => answerMap[f.id] || ''),
      ];
    });

    if (format === 'xlsx') {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Responses');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${form.title.replace(/[^a-z0-9]/gi, '_')}_responses.xlsx"`,
        },
      });
    }

    // CSV
    const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csvLines = [headers, ...rows].map(row => row.map(escape).join(','));
    const csv = csvLines.join('\r\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${form.title.replace(/[^a-z0-9]/gi, '_')}_responses.csv"`,
      },
    });
  } catch (error) {
    console.error('[GET /api/forms/[formId]/export]', error);
    return NextResponse.json({ message: 'Error exporting responses' }, { status: 500 });
  }
}
