import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function createTestAccount(email, password, name, role, isCoordinator = false) {
  console.log(`Creating ${role} account: ${email}...`);

  // Check if already exists in Prisma
  const existingPrisma = await prisma.user.findUnique({ where: { email } });
  if (existingPrisma) {
    console.log(`  ⚠️  ${email} already exists in DB. Skipping.`);
    return;
  }

  // 1. Create in Supabase Auth (try-catch because client throws on duplicates)
  let supabaseAuthId;
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name }
    });

    if (authError) throw authError;
    supabaseAuthId = authData.user.id;
  } catch (err) {
    if (err.message?.includes('already') || err.code === 'email_exists') {
      console.log(`  ⚠️  ${email} already exists in Supabase Auth. Looking up existing ID...`);
      // Look up the existing auth user by email
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existingAuth = listData?.users?.find(u => u.email === email);
      if (!existingAuth) {
        console.log(`  ❌ Could not find ${email} in Auth. Skipping.`);
        return;
      }
      supabaseAuthId = existingAuth.id;
    } else {
      throw err;
    }
  }

  // 2. Fetch CSE Department
  const dept = await prisma.department.findUnique({ where: { code: 'CSE' } });
  if (!dept) throw new Error('CSE department not found. Run db-update.bat first!');

  // 3. Create in Prisma Users Table
  const dbUser = await prisma.user.create({
    data: {
      supabaseAuthId,
      email,
      name,
      role,
      approvalStatus: 'APPROVED',
      departmentId: role !== 'ADMIN' ? dept.id : null
    }
  });

  // 4. Create Role-Specific Profile
  if (role === 'FACULTY') {
    await prisma.faculty.create({
      data: {
        userId: dbUser.id,
        employeeId: 'EMP' + Math.floor(Math.random() * 10000),
        designation: 'Professor',
        departmentId: dept.id
      }
    });
  } else if (role === 'STUDENT') {
    await prisma.student.create({
      data: {
        userId: dbUser.id,
        rollNo: 'ROLL' + Math.floor(Math.random() * 10000),
        year: 3,
        section: 'A',
        semester: 5,
        departmentId: dept.id,
        isCoordinator
      }
    });
  }

  console.log(`  ✅ Success: ${email}`);
}

async function main() {
  console.log('Generating Test Accounts...');
  const defaultPassword = 'Password123!';

  await createTestAccount('admin@erp.com', defaultPassword, 'Test Admin', 'ADMIN');
  await createTestAccount('faculty@erp.com', defaultPassword, 'Test Faculty', 'FACULTY');
  await createTestAccount('coordinator@erp.com', defaultPassword, 'Test Coordinator', 'STUDENT', true);
  await createTestAccount('volunteer@erp.com', defaultPassword, 'Test Volunteer', 'STUDENT', false);

  console.log('\n=======================================');
  console.log('ALL TEST ACCOUNTS GENERATED SUCESSFULLY');
  console.log('=======================================');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
