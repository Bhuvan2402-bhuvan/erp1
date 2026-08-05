import { NextResponse } from 'next/server';
import { withAuth, sanitizeErrorResponse } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase/admin';

// POST /api/profile/change-password — Update own password
export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ message: 'New password must be at least 8 characters long' }, { status: 400 });
    }

    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(user.dbUser.supabaseUid, {
      password: newPassword,
    });

    if (authErr) {
      console.error('Supabase update password error:', authErr.message);
      return NextResponse.json({ message: authErr.message || 'Failed to update password in authentication system' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
  } catch (error) {
    return sanitizeErrorResponse(error, 'Error changing password');
  }
});
