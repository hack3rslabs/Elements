const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phone = '+919502015977';
  const user = await prisma.user.findFirst({
    where: {
        OR: [
            { phone: phone },
            { phone: '9502015977' }
        ]
    }
  });
  console.log('User Found:', JSON.stringify(user, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
