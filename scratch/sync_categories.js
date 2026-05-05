const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

// Simple slugify function
function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return;
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const CATEGORIES = [
    { 
      name: "TERRACOTA PRODUCTS", 
      slug: "terracota-products",
      subCategories: [
        { name: "TERRACOTA CLAY JALI", slug: "jali" },
        { 
          name: "ROOF TILES", 
          slug: "roof-tiles",
          subCategories: [
            { name: "CLAY ROOF TILES", slug: "clay-roof-tiles" },
            { name: "CERAMIC ROOF TILES", slug: "ceramic-roof-tiles" },
          ]
        },
        { name: "TERRACOTA CLADING BRICKS", slug: "cladding-bricks" },
        { name: "DECORATIVE TILES", slug: "decorative-tiles" },
        { 
          name: "BRICKS", 
          slug: "bricks",
          subCategories: [
            { name: "SOLID BRICKS", slug: "solid-bricks" },
            { name: "HOLLOW BRICKS", slug: "hollow-bricks" },
          ]
        },
      ]
    }
  ];

  async function syncCategory(cat, parentId = null) {
    console.log(`Syncing ${cat.name} (slug: ${cat.slug})...`);
    let dbCat = await prisma.category.findUnique({ where: { slug: cat.slug } });
    
    if (!dbCat) {
      dbCat = await prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          parentId: parentId
        }
      });
      console.log(`  Created ${cat.name}`);
    } else if (dbCat.parentId !== parentId) {
      await prisma.category.update({
        where: { id: dbCat.id },
        data: { parentId: parentId }
      });
      console.log(`  Updated parent for ${cat.name}`);
    }

    if (cat.subCategories) {
      for (const sub of cat.subCategories) {
        await syncCategory(sub, dbCat.id);
      }
    }
  }

  try {
    for (const cat of CATEGORIES) {
      await syncCategory(cat);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
