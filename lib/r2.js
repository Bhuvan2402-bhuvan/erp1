import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client for Cloudflare R2
const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'vvitu-erp-storage';
const publicUrlBase = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';

let r2Client = null;

if (accountId && accessKeyId && secretAccessKey) {
  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Uploads a buffer to Cloudflare R2 bucket.
 * @param {Buffer|Uint8Array} fileBuffer 
 * @param {string} fileName 
 * @param {string} contentType 
 * @returns {Promise<{ key: string, url: string }>}
 */
export async function uploadToR2(fileBuffer, fileName, contentType = 'application/octet-stream') {
  if (!r2Client) {
    console.warn('[Cloudflare R2] R2 credentials not provided. Returning fallback URL.');
    return { key: fileName, url: `/uploads/${fileName}` };
  }

  const key = `uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await r2Client.send(command);

  const url = publicUrlBase
    ? `${publicUrlBase.replace(/\/$/, '')}/${key}`
    : `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`;

  return { key, url };
}

/**
 * Deletes an object from Cloudflare R2 bucket.
 * @param {string} key 
 */
export async function deleteFromR2(key) {
  if (!r2Client || !key) return;

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await r2Client.send(command);
  } catch (error) {
    console.error('[Cloudflare R2] Delete failed:', error);
  }
}

/**
 * Generates public URL for a given object key in R2 bucket.
 * @param {string} key 
 */
export function getR2PublicUrl(key) {
  if (!key) return '';
  if (key.startsWith('http://') || key.startsWith('https://')) return key;
  if (publicUrlBase) {
    return `${publicUrlBase.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
  }
  return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key.replace(/^\//, '')}`;
}

export { r2Client, bucketName };
