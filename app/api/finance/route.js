import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { validate, createFinanceSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';

const financeLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

export const GET = withAuth(async (req, { user }) => {
  try {
    const records = await prisma.financeRecord.findMany({
      include: {
        createdBy: {
          select: { name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const summary = records.reduce((acc, curr) => {
      if (curr.type === 'INCOME') acc.totalIncome += curr.amount;
      else if (curr.type === 'EXPENSE') acc.totalExpense += curr.amount;
      else if (curr.type === 'BUDGET') acc.totalBudget += curr.amount;
      return acc;
    }, { totalIncome: 0, totalExpense: 0, totalBudget: 0 });

    summary.balance = summary.totalBudget + summary.totalIncome - summary.totalExpense;

    return NextResponse.json({ records, summary }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching finance records');
  }
});

export const POST = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    if (dbUser.role !== 'ADMIN' && dbUser.role !== 'FACULTY' && !(dbUser.role === 'STUDENT' && dbUser.student?.isCoordinator)) {
      return NextResponse.json({ message: 'Forbidden. Only coordinators, faculty, or admins can post financial records.' }, { status: 403 });
    }

    // Rate limit: 20 finance records per user per minute
    const { success: withinLimit } = financeLimiter.check(20, `finance:${dbUser.id}`);
    if (!withinLimit) {
      return NextResponse.json({ message: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    const body = await req.json();
    const { success, data: validated, error: validationError } = validate(createFinanceSchema, body);
    if (!success) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const { title, amount, type, category, description, receiptUrl } = validated;

    const record = await prisma.financeRecord.create({
      data: {
        title,
        amount,
        type,
        category,
        description: description || null,
        receiptUrl: receiptUrl || null,
        createdById: dbUser.id
      },
      include: {
        createdBy: { select: { name: true, email: true } }
      }
    });

    return NextResponse.json({ message: 'Financial record created successfully', record }, { status: 201 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error creating financial record');
  }
});

export const DELETE = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    if (dbUser.role !== 'ADMIN' && dbUser.role !== 'FACULTY') {
      return NextResponse.json({ message: 'Forbidden. Only faculty or admins can delete finance entries.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'Record ID required' }, { status: 400 });

    // Verify the record exists before deleting
    const record = await prisma.financeRecord.findUnique({ where: { id } });
    if (!record) return NextResponse.json({ message: 'Finance record not found' }, { status: 404 });

    await prisma.financeRecord.delete({ where: { id } });
    return NextResponse.json({ message: 'Financial record deleted' }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error deleting finance record');
  }
});
