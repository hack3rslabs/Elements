import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient | null };

function createPrismaClient(): PrismaClient | null {
    // Skip Prisma if DATABASE_URL is not configured
    if (!process.env.DATABASE_URL) {
        console.warn("[Prisma] DATABASE_URL not set — database features disabled");
        return null;
    }
    try {
        return new PrismaClient({
            log: process.env.NODE_ENV === "development" ? ["query"] : [],
        });
    } catch (e) {
        console.error("[Prisma] Failed to initialize PrismaClient:", e);
        return null;
    }
}

export const prisma: PrismaClient | null =
    globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) {
    globalForPrisma.prisma = prisma;
}
