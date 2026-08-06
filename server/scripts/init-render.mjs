import prisma from '../lib/prisma.js';
import dotenv from 'dotenv';

dotenv.config();

async function initRender() {
  console.log('\n🚀 --- Render Express Backend & Database Initialization ---');

  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL environment variable is missing.');
    console.warn('   Please configure DATABASE_URL in your Render Web Service settings or .env file.\n');
    return;
  }

  try {
    console.log('📡 Connecting to PostgreSQL database on Render...');
    
    // Seed Departments
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
    console.log('✅ Academic Departments populated (10 Branches).');

    // Seed Campaign Widget default
    const existingWidget = await prisma.campaignWidget.findFirst();
    if (!existingWidget) {
      await prisma.campaignWidget.create({
        data: {
          campaignName: 'Annual Blood Donation & Relief Drive',
          currentCount: 142,
          targetCount: 200,
          activities: ['Medical Triage', 'Donor Registration', 'Refreshments & Badges'],
          isActive: true
        }
      });
      console.log('✅ Default Campaign Widget initialized.');
    }

    // Seed Testimonials
    const count = await prisma.testimonial.count();
    if (count === 0) {
      await prisma.testimonial.createMany({
        data: [
          { name: 'Dr. Ramesh Babu', role: 'Program Officer', dept: 'CSE', quote: 'Our student volunteers have demonstrated exemplary leadership across 25+ mega drives this year.', avatar: 'RB', sortOrder: 1 },
          { name: 'Ananya Sharma', role: 'Student Coordinator', dept: 'ECE', quote: 'The real-time QR attendance gate and digital portfolio tracking make organizing NSS events effortless.', avatar: 'AS', sortOrder: 2 },
          { name: 'Vikram Mehta', role: 'Senior Volunteer', dept: 'MECH', quote: 'Earning milestone badges and cryptographically verified certificates gives us true recognition for our social work.', avatar: 'VM', sortOrder: 3 }
        ]
      });
      console.log('✅ Default Testimonials initialized.');
    }

    console.log('\n🎉 Render Backend Database initialized and ready for production!\n');
  } catch (error) {
    console.error('\n❌ Database Initialization Failed:');
    console.error(error.message);
  } finally {
    if (prisma && typeof prisma.$disconnect === 'function') {
      await prisma.$disconnect();
    }
  }
}

initRender();
