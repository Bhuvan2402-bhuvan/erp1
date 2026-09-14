export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';

// GET /api/faculty-desk — Public: fetch all visible faculty desk profiles (PC first, then POs)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get('all') === '1';
    const where = showAll ? {} : { isVisible: true };

    const profiles = await prisma.facultyDesk.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    });

    const roleOrder = { NSS_PC: 0, NSS_PO: 1, NSS_SC: 2 };
    const sorted = profiles.sort((a, b) => {
      const ra = roleOrder[a.role] ?? 1;
      const rb = roleOrder[b.role] ?? 1;
      if (ra !== rb) return ra - rb;
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });

    const formatted = sorted.map(p => ({
      ...p,
      achievements: Array.isArray(p.achievements) ? p.achievements : []
    }));

    const headers = showAll ? {} : { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' };
    return NextResponse.json({ profiles: formatted }, { status: 200, headers });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error fetching faculty desk profiles');
  }
}

// POST /api/faculty-desk — Admin only: create a new faculty desk profile
export const POST = withAuth(async (req, { user }) => {
  try {
    const { dbUser } = user;
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { name, role, designation, branch, foreword, achievements, photoUrl, sortOrder, isVisible } = body;

    if (!name || !designation || !branch || !foreword) {
      return NextResponse.json({ message: 'Name, designation, branch, and foreword are required' }, { status: 400 });
    }

    const safeAchievements = Array.isArray(achievements)
      ? achievements.filter(a => typeof a === 'string' && a.trim().length > 0)
      : [];

    const profile = await prisma.facultyDesk.create({
      data: {
        name,
        role: ['NSS_PC', 'NSS_SC'].includes(role) ? role : 'NSS_PO',
        designation,
        branch,
        foreword,
        achievements: safeAchievements,
        photoUrl: photoUrl || null,
        sortOrder: Number(sortOrder) || 0,
        isVisible: isVisible !== false,
      }
    });

    return NextResponse.json({ message: 'Faculty desk profile created', profile }, { status: 201 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error creating faculty desk profile');
  }
});
