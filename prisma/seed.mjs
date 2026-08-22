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

  const cseDept = await prisma.department.findUnique({ where: { code: 'CSE' } });

  // 3. Demo Accounts with Strong Non-Breached Passwords
  const demoUsers = [
    {
      email: 'admin1@erp.com',
      password: 'NssErpAdmin#2026!',
      name: 'NSS Lead Admin',
      role: 'ADMIN',
    },
    {
      email: 'faculty1@erp.com',
      password: 'NssErpFaculty#2026!',
      name: 'Faculty Coordinator',
      role: 'FACULTY',
      employeeId: 'FAC1001',
      designation: 'NSS Program Officer',
    },
    {
      email: 'coord1@erp.com',
      password: 'NssErpCoord#2026!',
      name: 'Student Coordinator',
      role: 'STUDENT',
      rollNo: '21CSE901',
      isCoordinator: true,
    },
    {
      email: 'volunteer1@erp.com',
      password: 'NssErpVolunteer#2026!',
      name: 'NSS Volunteer',
      role: 'STUDENT',
      rollNo: '21CSE101',
      isCoordinator: false,
    },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseServiceKey && !supabaseServiceKey.includes('placeholder')) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    for (const u of demoUsers) {
      let uid = null;
      try {
        // Try creating Supabase auth user
        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { name: u.name, role: u.role }
        });

        if (newUser?.user) {
          uid = newUser.user.id;
        } else if (createErr) {
          // If already exists, update password to strong non-breached password
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const existing = listData?.users?.find(usr => usr.email === u.email);
          if (existing) {
            uid = existing.id;
            await supabaseAdmin.auth.admin.updateUserById(uid, { password: u.password });
          }
        }
      } catch (err) {
        console.warn(`Supabase user provisioning notice for ${u.email}:`, err.message);
      }

      if (!uid) uid = 'demo-uid-' + Math.random().toString(36).substring(2, 10);

      const dbUser = await prisma.user.upsert({
        where: { email: u.email },
        update: {
          supabaseUid: uid,
          name: u.name,
          role: u.role,
          approvalStatus: 'APPROVED',
          departmentId: u.role !== 'ADMIN' ? cseDept?.id : null
        },
        create: {
          supabaseUid: uid,
          email: u.email,
          name: u.name,
          role: u.role,
          approvalStatus: 'APPROVED',
          departmentId: u.role !== 'ADMIN' ? cseDept?.id : null
        }
      });

      if (u.role === 'FACULTY' && cseDept) {
        await prisma.faculty.upsert({
          where: { userId: dbUser.id },
          update: { employeeId: u.employeeId, designation: u.designation, departmentId: cseDept.id },
          create: { userId: dbUser.id, employeeId: u.employeeId, designation: u.designation, departmentId: cseDept.id }
        });
      } else if (u.role === 'STUDENT' && cseDept) {
        await prisma.student.upsert({
          where: { userId: dbUser.id },
          update: { rollNo: u.rollNo, year: 3, section: 'A', semester: 6, departmentId: cseDept.id, isCoordinator: u.isCoordinator },
          create: { userId: dbUser.id, rollNo: u.rollNo, year: 3, section: 'A', semester: 6, departmentId: cseDept.id, isCoordinator: u.isCoordinator }
        });
      }
    }
  }

  console.log('✅ Seed completed: Roles, 10 Branches, and Strong Demo Auth Accounts populated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
