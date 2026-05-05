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
    const cats = await prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: 'terracota', mode: 'insensitive' } },
          { name: { contains: 'terracotta', mode: 'insensitive' } },
          { slug: { contains: 'terracota', mode: 'insensitive' } },
          { slug: { contains: 'terracotta', mode: 'insensitive' } }
        ]
      }
    });
    console.log(JSON.stringify(cats, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
