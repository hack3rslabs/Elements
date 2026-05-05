const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    return;
  }
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const categories = await prisma.category.findMany({
      include: { parent: true }
    });
    console.log('--- Categories in DB ---');
    categories.forEach(c => {
      console.log(`- ${c.name} (slug: ${c.slug}, id: ${c.id}) Parent: ${c.parent ? c.parent.name : 'None'}`);
    });

    const products = await prisma.product.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { category: true }
    });
    console.log('\n--- Recent Products ---');
    products.forEach(p => {
      console.log(`- ${p.name} (sku: ${p.sku}) Category: ${p.category ? p.category.name : 'None'} (slug: ${p.category ? p.category.slug : 'N/A'})`);
    });

  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
