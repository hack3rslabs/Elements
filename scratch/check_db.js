const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    select: { name: true, slug: true }
  });
  console.log('Categories in DB:');
  console.log(JSON.stringify(categories, null, 2));

  const productsCount = await prisma.product.count();
  console.log('\nTotal Products:', productsCount);

  const productsWithoutCategory = await prisma.product.count({
    where: { categoryId: { equals: '' } }
  });
  console.log('Products without category:', productsWithoutCategory);

  const recentProducts = await prisma.product.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { category: true }
  });
  console.log('\nRecent 5 Products:');
  console.log(JSON.stringify(recentProducts.map(p => ({
    name: p.name,
    sku: p.sku,
    category: p.category?.name,
    categorySlug: p.category?.slug
  })), null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
