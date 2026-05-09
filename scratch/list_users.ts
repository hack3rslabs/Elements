import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });
    console.log('--- ALL USERS ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('--- END ---');
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllUsers();
