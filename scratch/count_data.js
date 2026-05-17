const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const productCount = await prisma.product.count();
  const categoryCount = await prisma.category.count();
  console.log('Total Products (Models):', productCount);
  console.log('Total Categories in DB:', categoryCount);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
