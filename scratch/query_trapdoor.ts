import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: 'Trap',
        mode: 'insensitive'
      }
    },
    include: {
      category: true
    }
  });
  console.log(JSON.stringify(products, null, 2));
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
