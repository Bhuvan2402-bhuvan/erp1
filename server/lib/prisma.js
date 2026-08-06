require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

let prisma;

try {
  const globalForPrisma = global;
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  prisma = globalForPrisma.prisma;
} catch (e) {
  console.warn('[Prisma Init Warning]', e.message);
  prisma = new Proxy({}, {
    get() {
      throw new Error('Prisma database client not initialized. Check DATABASE_URL in environment.');
    }
  });
}

module.exports = prisma;
