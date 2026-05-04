import { prisma } from '../src/lib/prisma';

async function main() {
  if (!prisma) {
    console.log("Prisma not initialized");
    return;
  }
  try {
    const count = await prisma.cRMLead.count();
    console.log("CRMLead count:", count);
  } catch (e) {
    console.error("Error accessing CRMLead:", e);
  }
}

main();
