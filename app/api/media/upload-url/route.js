import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUser } from '@/lib/auth-helpers';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const uploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1).max(100),
  folder: z.string().max(100).optional().default('uploads'),
});

// POST /api/media/upload-url — Generate a short-lived signed upload URL for Supabase Storage
export async function POST(request) {
  try {
    const userContext = await getUser();
    if (!userContext || !userContext.dbUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parse = uploadUrlSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({
        message: 'Invalid request body',
        errors: parse.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { fileName, fileType, folder } = parse.data;

    // Sanitise filename
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const key = `${Date.now()}-${safeFileName}`;

    let bucketName = folder;
    if (folder === 'events') bucketName = 'event-media';
    if (folder === 'proof' || folder === 'warning-proofs') bucketName = 'warning-proofs';
    if (folder === 'receipt' || folder === 'finance') bucketName = 'finance';

    // Create signed upload URL in Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUploadUrl(key);

    if (error || !data?.signedUrl) {
      throw error || new Error('Failed to generate signed URL');
    }

    const { signedUrl } = data;
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(key);

    return NextResponse.json({
      uploadUrl: signedUrl,
      publicUrl,
      key
    });
  } catch (error) {
    console.error('[Media Route] Failed to generate signed upload URL:', error);
    return NextResponse.json({ message: 'Failed to generate upload URL. Please try again.' }, { status: 500 });
  }
}
