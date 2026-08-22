import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/media/health — Storage health report
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return NextResponse.json({
    status: 'ok',
    storage: 'Supabase Storage',
    configured: Boolean(supabaseUrl),
    timestamp: new Date().toISOString(),
  });
}
