import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');


  // 2. Exact Branches from Requirements
  const departments = [
    { name: 'B.Tech - Computer Science and Engineering', code: 'CSE' },
    { name: 'B.Tech - CSE (Artificial Intelligence and Machine Learning)', code: 'CSE-AIML' },
    { name: 'B.Tech - CSE (Artificial Intelligence and Data Science)', code: 'CSE-AIDS' },
    { name: 'B.Tech - CSE (IoT and Cyber Security including Block Chain Technology)', code: 'CSE-IOT' },
    { name: 'B.Tech - Electronics and Communication Engineering', code: 'ECE' },
    { name: 'B.Tech - Electrical and Electronics Engineering', code: 'EEE' },
    { name: 'B.Tech - Mechanical Engineering', code: 'MECH' },
    { name: 'B.Tech - Civil Engineering', code: 'CIVIL' },
    { name: 'BBA', code: 'BBA' },
    { name: 'MBA', code: 'MBA' }
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name },
      create: dept
    });
  }

  // Provision Production Lead Admin Account
  const adminEmail = 'admin@vvitnss.in';
  const adminPass = 'AdminNss@2026!';
  const adminName = 'VVIT NSS Lead Administrator';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let uid = null;
  if (supabaseUrl && supabaseServiceKey && !supabaseServiceKey.includes('placeholder')) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPass,
        email_confirm: true,
        user_metadata: { name: adminName, role: 'ADMIN' }
      });

      if (newUser?.user) {
        uid = newUser.user.id;
      } else if (createErr) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData?.users?.find(usr => usr.email === adminEmail);
        if (existing) {
          uid = existing.id;
          await supabaseAdmin.auth.admin.updateUserById(uid, { password: adminPass });
        }
      }
    } catch (err) {
      console.warn('Supabase admin provisioning notice:', err.message);
    }
  }

  if (!uid) uid = 'admin-uid-' + Math.random().toString(36).substring(2, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      supabaseUid: uid,
      name: adminName,
      role: 'ADMIN',
      approvalStatus: 'APPROVED',
      isBlocked: false
    },
    create: {
      supabaseUid: uid,
      email: adminEmail,
      name: adminName,
      role: 'ADMIN',
      approvalStatus: 'APPROVED',
      isBlocked: false
    }
  });

  console.log('✅ Seed completed: 10 Departments and Production Lead Admin Account (admin@vvitnss.in) populated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
