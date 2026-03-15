const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany().then(u => console.log('Users count:', u.length)).catch(console.error).finally(() => prisma.$disconnect());
