const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Update all users who have a phone number to have the USER role
  const result = await prisma.user.updateMany({
    where: {
      phone: { not: null }
    },
    data: {
      role: 'USER'
    }
  });
  
  console.log(`Updated ${result.count} users to USER role.`);
  
  // List current admins (if any left - e.g. email only users)
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' }
  });
  console.log('Current Admins:', admins.map(a => a.email));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
