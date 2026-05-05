const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return;
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const products = await prisma.product.findMany({
      select: { name: true, sku: true, category: { select: { name: true } } }
    });
    console.log('--- All Products ---');
    products.forEach(p => {
      console.log(`- ${p.name} (sku: ${p.sku}) Category: ${p.category ? p.category.name : 'None'}`);
    });

  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
