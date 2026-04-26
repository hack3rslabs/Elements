import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient | null };

function createPrismaClient(): PrismaClient | null {
    // Skip Prisma if DATABASE_URL is not configured
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.warn("[Prisma] DATABASE_URL not set — database features disabled");
        return null;
    }
    
    try {
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        return new PrismaClient({
            adapter,
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

