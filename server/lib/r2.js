'use strict';

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// ─── Client initialisation ────────────────────────────────────────────────────

const accountId       = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId     = process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName      = process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME || 'vvitu-erp-storage';
const publicUrlBase   = process.env.R2_PUBLIC_URL  || process.env.CLOUDFLARE_R2_PUBLIC_URL || '';

let r2Client = null;

if (accountId && accessKeyId && secretAccessKey) {
  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
} else {
  console.warn('[R2] Missing R2 credentials — upload endpoints will return an error.');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the public CDN URL for a given object key.
 * @param {string} key  R2 object key (e.g. "events/123-photo.jpg")
 * @returns {string}
 */
function buildPublicUrl(key) {
  if (publicUrlBase) {
    return `${publicUrlBase.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
  }
  return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key.replace(/^\//, '')}`;
}

// ─── Presigned Upload URL ─────────────────────────────────────────────────────

/**
 * Generate a short-lived presigned PUT URL so the browser can upload
 * a file directly to R2 without routing the binary through Render.
 *
 * @param {string} key          Object key inside the bucket (e.g. "events/1234-photo.jpg")
 * @param {string} contentType  MIME type of the file (e.g. "image/jpeg")
 * @param {number} expiresIn    Seconds until the URL expires (default: 300 = 5 minutes)
 * @returns {Promise<{ uploadUrl: string, publicUrl: string }>}
 */
async function generatePresignedUploadUrl(key, contentType = 'application/octet-stream', expiresIn = 300) {
  if (!r2Client) {
    throw new Error('R2 client is not initialised — check R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY env vars.');
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });
  const publicUrl = buildPublicUrl(key);

  return { uploadUrl, publicUrl };
}

// ─── Direct Upload (server-side, for backward compat) ────────────────────────

/**
 * Upload a Buffer directly to R2 from the server.
 * Prefer presigned URLs for production — this is kept for scripts / seeds.
 *
 * @param {Buffer|Uint8Array} fileBuffer
 * @param {string} fileName  Original file name
 * @param {string} contentType
 * @returns {Promise<{ key: string, url: string }>}
 */
async function uploadToR2(fileBuffer, fileName, contentType = 'application/octet-stream') {
  if (!r2Client) {
    console.warn('[R2] No client — returning fallback URL.');
    const key = `uploads/${Date.now()}-${fileName}`;
    return { key, url: buildPublicUrl(key) };
  }

  const key = `uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
  await r2Client.send(new PutObjectCommand({ Bucket: bucketName, Key: key, Body: fileBuffer, ContentType: contentType }));
  return { key, url: buildPublicUrl(key) };
}

/**
 * Delete an object from R2.
 * @param {string} key  Object key to delete
 */
async function deleteFromR2(key) {
  if (!r2Client || !key) return;
  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
  } catch (err) {
    console.error('[R2] Delete failed:', err.message);
  }
}

/**
 * Get the public URL for an existing R2 key.
 * Passes through full https:// URLs unchanged.
 * @param {string} key
 * @returns {string}
 */
function getR2PublicUrl(key) {
  if (!key) return '';
  if (key.startsWith('http://') || key.startsWith('https://')) return key;
  return buildPublicUrl(key);
}

module.exports = {
  r2Client,
  bucketName,
  generatePresignedUploadUrl,
  uploadToR2,
  deleteFromR2,
  getR2PublicUrl,
  buildPublicUrl,
};
