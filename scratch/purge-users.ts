import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function purgeLegacyUsers() {
    console.log("--- Selective Database Purge Started ---");
    
    try {
        // 1. Count users before deletion
        const userCount = await prisma.user.count({ where: { role: 'USER' } });
        const adminCount = await prisma.user.count({ where: { role: { in: ['ADMIN', 'STAFF', 'SUB_ADMIN'] } } });

        console.log(`Found ${userCount} customer accounts to delete.`);
        console.log(`Found ${adminCount} admin/staff accounts to keep.`);

        // 2. Clear VerificationOTP (legacy phone OTPs)
        const deletedOtps = await prisma.verificationOTP.deleteMany({});
        console.log(`Cleared ${deletedOtps.count} legacy verification records.`);

        // 3. Delete Customer Users
        // NOTE: If you have foreign key constraints (like Orders), you might need to handle them.
        // Prisma will handle it if onDelete: Cascade is set in schema.
        const deletedUsers = await prisma.user.deleteMany({
            where: { role: 'USER' }
        });

        console.log(`Successfully deleted ${deletedUsers.count} customer accounts.`);
        console.log("Migration complete. Your database now only contains Admin and Staff accounts.");

    } catch (error) {
        console.error("Purge failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

purgeLegacyUsers();
