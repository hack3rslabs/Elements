import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      phone: true,
      name: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });
  console.log(JSON.stringify(users, null, 2));
}

checkUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
