import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database & Provisioning Accounts...');

  // 1. Departments / Branches
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

  const cseDept = await prisma.department.findUnique({ where: { code: 'CSE' } });

  // 2. Build Account List
  const accountsToProvision = [
    // Main Admin
    { email: 'admin@vvitnss.in', password: 'AdminNss@2026!', name: 'VVIT NSS Lead Administrator', role: 'ADMIN' },

    // Administrator Accounts (1-4)
    { email: 'admin1@erp.com', password: 'AdminPass1!', name: 'Admin Lead 1', role: 'ADMIN' },
    { email: 'admin2@erp.com', password: 'AdminPass2!', name: 'Admin Lead 2', role: 'ADMIN' },
    { email: 'admin3@erp.com', password: 'AdminPass3!', name: 'Admin Lead 3', role: 'ADMIN' },
    { email: 'admin4@erp.com', password: 'AdminPass4!', name: 'Admin Lead 4', role: 'ADMIN' },
  ];

  // Faculty Coordinator Accounts (1-15)
  for (let i = 1; i <= 15; i++) {
    accountsToProvision.push({
      email: `faculty${i}@erp.com`,
      password: `FacultyPass${i}!`,
      name: `Faculty Coordinator ${i}`,
      role: 'FACULTY',
      employeeId: `FAC10${i < 10 ? '0' + i : i}`,
      designation: 'NSS Program Officer'
    });
  }

  // Student Coordinator Accounts (1-20)
  for (let i = 1; i <= 20; i++) {
    accountsToProvision.push({
      email: `coord${i}@erp.com`,
      password: `CoordPass${i}!`,
      name: `Student Coordinator ${i}`,
      role: 'STUDENT',
      isCoordinator: true,
      rollNo: `21CSE9${i < 10 ? '0' + i : i}`
    });
  }

  // Volunteer Student Accounts (1-5)
  for (let i = 1; i <= 5; i++) {
    accountsToProvision.push({
      email: `volunteer${i}@erp.com`,
      password: `VolunteerPass${i}!`,
      name: `Student Volunteer ${i}`,
      role: 'STUDENT',
      isCoordinator: false,
      rollNo: `21CSE1${i < 10 ? '0' + i : i}`
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let supabaseAdmin = null;
  if (supabaseUrl && supabaseServiceKey && !supabaseServiceKey.includes('placeholder')) {
    const { createClient } = await import('@supabase/supabase-js');
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }

  console.log(`Provisioning ${accountsToProvision.length} total accounts in Supabase Auth & PostgreSQL...`);

  let existingAuthUsers = [];
  if (supabaseAdmin) {
    try {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      existingAuthUsers = listData?.users || [];
    } catch (e) {
      console.warn('Could not fetch existing users:', e.message);
    }
  }

  for (const acc of accountsToProvision) {
    let uid = null;

    if (supabaseAdmin) {
      const existing = existingAuthUsers.find(u => u.email === acc.email);
      if (existing) {
        uid = existing.id;
        try {
          await supabaseAdmin.auth.admin.updateUserById(uid, {
            password: acc.password,
            user_metadata: { name: acc.name, role: acc.role }
          });
        } catch (e) {
          console.warn(`Notice updating ${acc.email}: ${e.message}`);
        }
      } else {
        try {
          const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: acc.email,
            password: acc.password,
            email_confirm: true,
            user_metadata: { name: acc.name, role: acc.role }
          });
          if (newUser?.user) {
            uid = newUser.user.id;
          } else if (createErr) {
            console.warn(`Could not create ${acc.email}: ${createErr.message}`);
          }
        } catch (e) {
          console.warn(`Notice creating ${acc.email}: ${e.message}`);
        }
      }
    }

    if (!uid) uid = 'uid-' + Math.random().toString(36).substring(2, 10);

    const dbUser = await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        supabaseUid: uid,
        name: acc.name,
        role: acc.role,
        approvalStatus: 'APPROVED',
        isBlocked: false,
        departmentId: acc.role !== 'ADMIN' ? cseDept?.id : null
      },
      create: {
        supabaseUid: uid,
        email: acc.email,
        name: acc.name,
        role: acc.role,
        approvalStatus: 'APPROVED',
        isBlocked: false,
        departmentId: acc.role !== 'ADMIN' ? cseDept?.id : null
      }
    });

    if (acc.role === 'FACULTY' && cseDept) {
      await prisma.faculty.upsert({
        where: { userId: dbUser.id },
        update: { employeeId: acc.employeeId, designation: acc.designation, departmentId: cseDept.id },
        create: { userId: dbUser.id, employeeId: acc.employeeId, designation: acc.designation, departmentId: cseDept.id }
      });
    } else if (acc.role === 'STUDENT' && cseDept) {
      await prisma.student.upsert({
        where: { userId: dbUser.id },
        update: { rollNo: acc.rollNo, year: 3, section: 'A', semester: 6, departmentId: cseDept.id, isCoordinator: acc.isCoordinator || false, points: acc.isCoordinator ? 120 : 50 },
        create: { userId: dbUser.id, rollNo: acc.rollNo, year: 3, section: 'A', semester: 6, departmentId: cseDept.id, isCoordinator: acc.isCoordinator || false, points: acc.isCoordinator ? 120 : 50 }
      });
    }
  }

  console.log(`✅ Successfully seeded database & provisioned all ${accountsToProvision.length} accounts!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
