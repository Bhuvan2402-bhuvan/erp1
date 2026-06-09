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
      update: { name: dept.name }, // Ensure name is exactly as requested
      create: dept
    });
  }

  console.log('✅ Seed completed: Roles and 10 Branches populated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
