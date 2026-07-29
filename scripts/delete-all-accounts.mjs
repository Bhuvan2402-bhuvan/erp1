import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import admin from 'firebase-admin';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

const apps = admin.apps || admin.default?.apps || [];
if (!apps.length) {
  try {
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-app'
    });
  } catch (err) {}
}

const adminAuth = admin.auth ? admin.auth() : admin.default.auth();
const prisma = new PrismaClient();

async function purgeAllData() {
  console.log('🧹 Purging all accounts, profiles, and dependent data...\n');

  try {
    await prisma.eventAttendance.deleteMany({});
    await prisma.eventRegistration.deleteMany({});
    await prisma.eventPhoto.deleteMany({});
    await prisma.certificate.deleteMany({});
    await prisma.issue.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.publicMessage.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.financeRecord.deleteMany({});
    await prisma.documentation.deleteMany({});
    await prisma.pointLog.deleteMany({});
    await prisma.warningLog.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.faculty.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('  ✅ Database tables purged successfully.');
  } catch (e) {
    console.warn('  ⚠️ Exception purging database tables:', e.message);
  }

  console.log('\n🔐 Purging Firebase Auth Users...');
  let totalAuthDeleted = 0;

  try {
    const listResult = await adminAuth.listUsers(1000);
    for (const u of listResult.users) {
      try {
        await adminAuth.deleteUser(u.uid);
        totalAuthDeleted++;
        console.log(`  🗑️ Deleted Firebase auth user: ${u.email || u.uid}`);
      } catch (err) {}
    }
  } catch (err) {
    console.warn('  ⚠️ Firebase Admin listUsers notice:', err.message);
  }

  console.log('\n======================================================');
  console.log(`✅ PURGE COMPLETE! Cleared database tables and ${totalAuthDeleted} Firebase accounts.`);
  console.log('======================================================\n');
}

purgeAllData()
  .catch(err => console.error('Fatal purge error:', err))
  .finally(() => prisma.$disconnect().catch(() => {}));
