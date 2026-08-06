'use strict';

/**
 * POST /api/media/upload-url
 *
 * Generates a short-lived (5 min) presigned PUT URL for a Cloudflare R2 object
 * so the browser can upload files directly — without routing binary data through Render.
 *
 * Request body:
 *   { fileName: string, fileType: string, folder?: string }
 *
 * Response:
 *   { uploadUrl: string, publicUrl: string, key: string }
 *
 * Auth: Requires a valid Supabase JWT (via authenticate middleware).
 */

const express = require('express');
const { z }   = require('zod');

const { authenticate }             = require('../middleware/auth');
const { generatePresignedUploadUrl } = require('../lib/r2');

const router = express.Router();

// ─── Input validation schema ──────────────────────────────────────────────────

const uploadUrlSchema = z.object({
  fileName:  z.string().min(1).max(255),
  fileType:  z.string().min(1).max(100),   // MIME type e.g. "image/jpeg"
  folder:    z.string().max(100).optional().default('uploads'),
});

// ─── POST /upload-url ─────────────────────────────────────────────────────────

router.post('/upload-url', authenticate, async (req, res) => {
  try {
    // Validate request body
    const parse = uploadUrlSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        message: 'Invalid request body',
        errors: parse.error.flatten().fieldErrors,
      });
    }

    const { fileName, fileType, folder } = parse.data;

    // Sanitise filename to prevent path traversal
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');

    // Build object key: <folder>/<timestamp>-<sanitised-filename>
    const key = `${folder}/${Date.now()}-${safeFileName}`;

    // Generate presigned PUT URL (5-minute expiry by default)
    const { uploadUrl, publicUrl } = await generatePresignedUploadUrl(key, fileType, 300);

    return res.status(200).json({ uploadUrl, publicUrl, key });
  } catch (error) {
    console.error('[Media Route] Failed to generate presigned URL:', error.message);

    if (error.message.includes('not initialised')) {
      return res.status(503).json({ message: 'Storage service is not configured. Contact an administrator.' });
    }

    return res.status(500).json({ message: 'Failed to generate upload URL. Please try again.' });
  }
});

// ─── GET /health (storage ping) ───────────────────────────────────────────────

router.get('/health', (req, res) => {
  const r2AccountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  res.json({
    status: 'ok',
    storage: 'Cloudflare R2',
    configured: Boolean(r2AccountId),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
