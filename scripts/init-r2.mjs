import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'vvitu-erp-storage';
const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';

async function verifyR2Connection() {
  console.log('\n🔍 --- Cloudflare R2 Initialization & Verification ---');
  console.log(`Bucket Name: ${bucketName}`);
  console.log(`Account ID:  ${accountId ? accountId.substring(0, 6) + '...' : 'NOT SET'}`);
  console.log(`Public URL:  ${publicUrl || 'Default R2 endpoint'}\n`);

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.warn('⚠️  Cloudflare R2 credentials missing in .env file.');
    console.warn('   Please configure CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY.');
    console.warn('   The application will run in fallback storage mode until credentials are set.\n');
    return false;
  }

  try {
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const testKey = `init-test-${Date.now()}.txt`;
    const testContent = Buffer.from(`Cloudflare R2 storage initialized successfully for VVITU NSS ERP at ${new Date().toISOString()}`);

    console.log(`📤 Testing PUT object to Cloudflare R2 (${testKey})...`);
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    }));
    console.log('✅ PUT command succeeded!');

    console.log(`📥 Testing GET object from Cloudflare R2 (${testKey})...`);
    await s3.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    }));
    console.log('✅ GET command succeeded!');

    console.log(`🗑️  Cleaning up test object (${testKey})...`);
    await s3.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    }));
    console.log('✅ DELETE command succeeded!');

    console.log('\n🎉 Cloudflare R2 Storage is FULLY FUNCTIONAL and READY FOR PRODUCTION!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Cloudflare R2 Connection Failed:');
    console.error(error.message);
    console.error('\nCheck your Account ID, Access Key ID, Secret Access Key, and Bucket Name.\n');
    return false;
  }
}

verifyR2Connection();
