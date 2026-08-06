export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';

const DEFAULT_ACTIVITIES = [
  { title: 'Arun K. (Student) joined', subtitle: 'Registered for Plantation Drive • 2 mins ago', icon: 'users' },
  { title: 'Hour Audits Completed', subtitle: 'Dr. Srinivasan approved 12 certificates • 1 hour ago', icon: 'award' },
];

const DEFAULT_WIDGET = {
  id: 'default',
  campaignName: 'Blood Drive Registration',
  currentCount: 124,
  targetCount: 150,
  activities: DEFAULT_ACTIVITIES,
  isActive: true,
};

// GET /api/campaign-widget — Public: fetch active widget config
export async function GET() {
  try {
    const widget = await prisma.campaignWidget.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (widget) {
      // Ensure activities is always an array
      const activities = Array.isArray(widget.activities)
        ? widget.activities
        : (widget.activities ? JSON.parse(widget.activities) : DEFAULT_ACTIVITIES);
      return NextResponse.json({ widget: { ...widget, activities } }, { status: 200 });
    }
    return NextResponse.json({ widget: DEFAULT_WIDGET }, { status: 200 });
  } catch {
    return NextResponse.json({ widget: DEFAULT_WIDGET }, { status: 200 });
  }
}

// POST /api/campaign-widget — Admin: upsert the widget config
export const POST = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { campaignName, currentCount, targetCount, activities, isActive } = body;

    if (!campaignName || targetCount === undefined || currentCount === undefined) {
      return NextResponse.json({ message: 'campaignName, currentCount, and targetCount are required' }, { status: 400 });
    }

    // Validate activities array
    const safeActivities = Array.isArray(activities)
      ? activities.filter(a => a && typeof a.title === 'string').map(a => ({
          title: a.title || '',
          subtitle: a.subtitle || '',
          icon: a.icon || 'zap',
        }))
      : DEFAULT_ACTIVITIES;

    const data = {
      campaignName,
      currentCount: Number(currentCount),
      targetCount: Number(targetCount),
      activities: safeActivities,
      isActive: isActive !== false,
    };

    const existing = await prisma.campaignWidget.findFirst();
    let widget;
    if (existing) {
      widget = await prisma.campaignWidget.update({ where: { id: existing.id }, data });
    } else {
      widget = await prisma.campaignWidget.create({ data });
    }

    return NextResponse.json({ message: 'Widget updated', widget }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error updating widget');
  }
});
