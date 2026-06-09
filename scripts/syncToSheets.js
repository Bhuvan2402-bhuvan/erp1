const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('GOOGLE_SHEET_WEBHOOK_URL is not set in .env');
  }

  console.log('Fetching users from database...');
  const users = await prisma.user.findMany({
    select: {
      name: true,
      email: true,
      role: true,
      approvalStatus: true,
      isBlocked: true,
      createdAt: true
    }
  });

  console.log(`Found ${users.length} users. Syncing to Google Sheets...`);

  // Format dates for Google Sheets
  const payload = users.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString()
  }));

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('Sync Result:', result);
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
