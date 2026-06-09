// Run this once to create the first admin account:
// node scripts/seed-admin.mjs
//
// Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const ADMIN_EMAIL = 'admin@erp.com';
const ADMIN_PASSWORD = 'Admin@1234';
const ADMIN_NAME = 'Admin';

async function seedAdmin() {
  console.log('Creating Admin account...');

  // Check if already exists in Prisma
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log('⚠️  Admin already exists:', existing.email);
    return;
  }

  // 1. Create in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: ADMIN_NAME }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('⚠️  Admin already exists in Supabase Auth. Skipping.');
      return;
    }
    throw authError;
  }

  // 2. Create in Prisma Users Table
  await prisma.user.create({
    data: {
      supabaseAuthId: authData.user.id,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: 'ADMIN',
      approvalStatus: 'APPROVED'
    }
  });

  console.log('🎉 Admin created successfully!');
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
}

seedAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
