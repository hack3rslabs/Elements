require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { categories: mockCategories, products: mockProducts, reviews: mockReviews } = require('./data/products');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- SAFE SEED START ---');

  // ONLY RUN RESET IF EXPLICITLY ENABLED
  const forceReset = process.env.FORCE_RESET === "true";

  if (forceReset) {
    console.log("⚠️ Force reset enabled - clearing DB");
    await prisma.review.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  }

  // ADMIN (prevent duplicate)
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@elements.com' }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@elements.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log("Admin created");
  } else {
    console.log("Admin already exists - skipping");
  }

  // CATEGORIES (prevent duplicates)
  for (const cat of mockCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
      },
    });

    if (cat.children?.length) {
      for (const child of cat.children) {
        await prisma.category.upsert({
          where: { slug: child.slug },
          update: {},
          create: {
            id: child.id,
            name: child.name,
            slug: child.slug,
            parentId: cat.id,
          },
        });
      }
    }
  }

  console.log("Categories OK");

  // PRODUCTS (IMPORTANT FIX)
  for (const product of mockProducts) {
    await prisma.product.upsert({
      where: { sku: product.sku },   // KEY FIX
      update: {
        name: product.name,
        price: product.price,
        stock: product.stock,
        images: product.images,
      },
      create: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        slug: product.slug,
        shortDescription: product.shortDescription,
        description: product.description,
        price: product.price,
        mrp: product.mrp,
        stockStatus: product.stockStatus,
        stock: product.stock,
        images: product.images,
        specifications: product.specifications,
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
        categoryId: product.categoryId,
      },
    });
  }

  console.log("Products OK");

  console.log('--- SAFE SEED COMPLETE ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());