import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const accounts = [
  { email: 'admin1@erp.com', password: 'Password1!', name: 'Admin 1', role: 'ADMIN' },
  { email: 'admin2@erp.com', password: 'Password2!', name: 'Admin 2', role: 'ADMIN' },
  { email: 'admin3@erp.com', password: 'Password3!', name: 'Admin 3', role: 'ADMIN' },
  { email: 'faculty1@erp.com', password: 'Password1!', name: 'Faculty 1', role: 'FACULTY' },
  { email: 'faculty2@erp.com', password: 'Password2!', name: 'Faculty 2', role: 'FACULTY' },
  { email: 'faculty3@erp.com', password: 'Password3!', name: 'Faculty 3', role: 'FACULTY' },
  { email: 'faculty4@erp.com', password: 'Password4!', name: 'Faculty 4', role: 'FACULTY' },
  { email: 'faculty5@erp.com', password: 'Password5!', name: 'Faculty 5', role: 'FACULTY' },
  { email: 'faculty6@erp.com', password: 'Password6!', name: 'Faculty 6', role: 'FACULTY' },
  { email: 'faculty7@erp.com', password: 'Password7!', name: 'Faculty 7', role: 'FACULTY' },
  { email: 'faculty8@erp.com', password: 'Password8!', name: 'Faculty 8', role: 'FACULTY' },
  { email: 'faculty9@erp.com', password: 'Password9!', name: 'Faculty 9', role: 'FACULTY' },
  { email: 'faculty10@erp.com', password: 'Password10!', name: 'Faculty 10', role: 'FACULTY' },
  { email: 'faculty11@erp.com', password: 'Password11!', name: 'Faculty 11', role: 'FACULTY' },
  { email: 'faculty12@erp.com', password: 'Password12!', name: 'Faculty 12', role: 'FACULTY' },
  { email: 'faculty13@erp.com', password: 'Password13!', name: 'Faculty 13', role: 'FACULTY' },
  { email: 'faculty14@erp.com', password: 'Password14!', name: 'Faculty 14', role: 'FACULTY' },
  { email: 'faculty15@erp.com', password: 'Password15!', name: 'Faculty 15', role: 'FACULTY' },
  { email: 'coord1@erp.com', password: 'Password1!', name: 'Coordinator 1', role: 'STUDENT', isCoordinator: true },
  { email: 'coord2@erp.com', password: 'Password2!', name: 'Coordinator 2', role: 'STUDENT', isCoordinator: true },
  { email: 'coord3@erp.com', password: 'Password3!', name: 'Coordinator 3', role: 'STUDENT', isCoordinator: true },
  { email: 'coord4@erp.com', password: 'Password4!', name: 'Coordinator 4', role: 'STUDENT', isCoordinator: true },
  { email: 'coord5@erp.com', password: 'Password5!', name: 'Coordinator 5', role: 'STUDENT', isCoordinator: true },
  { email: 'coord6@erp.com', password: 'Password6!', name: 'Coordinator 6', role: 'STUDENT', isCoordinator: true },
  { email: 'coord7@erp.com', password: 'Password7!', name: 'Coordinator 7', role: 'STUDENT', isCoordinator: true },
  { email: 'coord8@erp.com', password: 'Password8!', name: 'Coordinator 8', role: 'STUDENT', isCoordinator: true },
  { email: 'coord9@erp.com', password: 'Password9!', name: 'Coordinator 9', role: 'STUDENT', isCoordinator: true },
  { email: 'coord10@erp.com', password: 'Password10!', name: 'Coordinator 10', role: 'STUDENT', isCoordinator: true },
  { email: 'coord11@erp.com', password: 'Password11!', name: 'Coordinator 11', role: 'STUDENT', isCoordinator: true },
  { email: 'coord12@erp.com', password: 'Password12!', name: 'Coordinator 12', role: 'STUDENT', isCoordinator: true },
  { email: 'coord13@erp.com', password: 'Password13!', name: 'Coordinator 13', role: 'STUDENT', isCoordinator: true },
  { email: 'coord14@erp.com', password: 'Password14!', name: 'Coordinator 14', role: 'STUDENT', isCoordinator: true },
  { email: 'coord15@erp.com', password: 'Password15!', name: 'Coordinator 15', role: 'STUDENT', isCoordinator: true },
];

async function main() {
  // Ensure a default department exists
  let dept = await prisma.department.findFirst();
  if (!dept) {
    dept = await prisma.department.create({
      data: {
        name: 'General',
        code: 'GEN'
      }
    });
  }

  for (const acc of accounts) {
    console.log(`Creating ${acc.email}...`);
    
    let existing = await prisma.user.findUnique({ where: { email: acc.email } });
    if (existing) {
      console.log(`User ${acc.email} already exists.`);
      continue;
    }
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: acc.email,
      password: acc.password,
      email_confirm: true,
      user_metadata: { full_name: acc.name }
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
         console.log(`User ${acc.email} already registered in Supabase Auth.`);
         continue;
      }
      console.error(`Error with ${acc.email}:`, authError);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        supabaseAuthId: authData.user.id,
        email: acc.email,
        name: acc.name,
        role: acc.role,
        approvalStatus: 'APPROVED'
      }
    });

    if (acc.role === 'FACULTY') {
      await prisma.faculty.create({
        data: {
          userId: user.id,
          employeeId: `FAC${Math.floor(Math.random() * 90000) + 10000}`,
          departmentId: dept.id
        }
      });
    } else if (acc.role === 'STUDENT') {
      await prisma.student.create({
        data: {
          userId: user.id,
          rollNo: `ROLL${Math.floor(Math.random() * 90000) + 10000}`,
          year: 1,
          section: 'A',
          semester: 1,
          departmentId: dept.id,
          isCoordinator: acc.isCoordinator || false
        }
      });
    }
    console.log(`Created ${acc.email} successfully.`);
  }
  
  console.log("All accounts processed.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
