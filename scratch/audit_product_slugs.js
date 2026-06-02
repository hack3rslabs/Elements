const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exitCode = 1;
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const products = await prisma.product.findMany({
      select: { id: true, name: true, slug: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const unsafe = products.filter((product) => {
      const currentSlug = product.slug || '';
      return !currentSlug || currentSlug !== slugify(currentSlug);
    });

    console.log(`Total products: ${products.length}`);
    console.log(`Unsafe slugs: ${unsafe.length}`);

    for (const product of unsafe) {
      console.log(`${product.name} | slug=${JSON.stringify(product.slug)} | safe=${slugify(product.slug || product.name)}`);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
