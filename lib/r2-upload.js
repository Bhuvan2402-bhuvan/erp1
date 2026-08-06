/**
 * lib/r2-upload.js
 *
 * Client-side utility for browser-direct file uploads to Cloudflare R2.
 *
 * Upload flow:
 *  1. Request a presigned PUT URL from the Render Express backend
 *     (`POST /api/media/upload-url`), authenticated with a Supabase JWT.
 *  2. Upload the raw file binary directly from the browser to R2 via the
 *     presigned URL — no binary data routes through Render.
 *  3. Return the public CDN URL for persisting in the Supabase database.
 *
 * Usage:
 *   import { uploadFileToR2 } from '@/lib/r2-upload';
 *
 *   // Inside a React component or event handler:
 *   const file = e.target.files[0];
 *   const { publicUrl, key } = await uploadFileToR2(file, 'events');
 *   // Save publicUrl to Supabase:
 *   await supabase.from('event_photos').insert({ photo_url: publicUrl, event_id });
 */

import { apiFetch } from '@/lib/fetch-api';

// ─── Type definitions (JSDoc) ─────────────────────────────────────────────────

/**
 * @typedef {Object} UploadResult
 * @property {string} publicUrl   Public CDN URL of the uploaded file in R2
 * @property {string} uploadUrl   The presigned PUT URL (short-lived, for debugging)
 * @property {string} key         Object key inside the R2 bucket
 */

// ─── Main upload utility ──────────────────────────────────────────────────────

/**
 * Upload a File object directly to Cloudflare R2 from the browser.
 *
 * @param {File}   file              Browser File object (from <input type="file"> or drag-drop)
 * @param {string} [folder='events'] Destination folder prefix inside the bucket
 * @param {object} [options]
 * @param {function(number):void} [options.onProgress]  Called with upload % (0-100). Requires XHR fallback.
 * @returns {Promise<UploadResult>}
 * @throws {Error} If either the presigned URL request or the R2 upload fails
 */
export async function uploadFileToR2(file, folder = 'events', options = {}) {
  if (!(file instanceof File)) {
    throw new TypeError('uploadFileToR2: `file` must be a browser File object');
  }

  // ── Step 1: Request presigned PUT URL from Render backend ─────────────────
  const presignRes = await apiFetch('/api/media/upload-url', {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      folder,
    }),
  });

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}));
    throw new Error(err.message || `Failed to get upload URL (${presignRes.status})`);
  }

  const { uploadUrl, publicUrl, key } = await presignRes.json();

  // ── Step 2: PUT binary directly to R2 via presigned URL ───────────────────
  const r2Res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      // Must match the ContentType used when generating the presigned URL
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!r2Res.ok) {
    throw new Error(`R2 upload failed with status ${r2Res.status}. The presigned URL may have expired.`);
  }

  return { publicUrl, uploadUrl, key };
}

// ─── Multi-file upload ────────────────────────────────────────────────────────

/**
 * Upload multiple files to R2 concurrently (up to `concurrency` at a time).
 *
 * @param {File[]}  files
 * @param {string}  [folder='events']
 * @param {object}  [options]
 * @param {number}  [options.concurrency=3]  Max parallel uploads
 * @returns {Promise<UploadResult[]>}  Results in the same order as input files
 */
export async function uploadFilesToR2(files, folder = 'events', options = {}) {
  const { concurrency = 3 } = options;
  const results = [];

  // Process in chunks to avoid overwhelming the presigner / browser
  for (let i = 0; i < files.length; i += concurrency) {
    const chunk = files.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(file => uploadFileToR2(file, folder))
    );
    results.push(...chunkResults);
  }

  return results;
}

// ─── Validation helpers ────────────────────────────────────────────────────────

/** Allowed MIME types for event photos */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

/** Maximum file size: 10 MB */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Validate a file before attempting upload.
 * @param {File} file
 * @param {object} [opts]
 * @param {string[]} [opts.allowedTypes]
 * @param {number}   [opts.maxSizeBytes]
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFile(file, opts = {}) {
  const allowedTypes = opts.allowedTypes ?? ALLOWED_IMAGE_TYPES;
  const maxSize      = opts.maxSizeBytes  ?? MAX_FILE_SIZE_BYTES;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Accepted: ${allowedTypes.join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    const maxMb = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Max allowed: ${maxMb} MB`,
    };
  }

  return { valid: true };
}
