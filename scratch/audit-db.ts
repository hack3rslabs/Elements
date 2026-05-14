import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function auditUsers() {
    console.log("--- User Database Audit ---");
    
    try {
        const totalUsers = await prisma.user.count();
        console.log(`Total Users: ${totalUsers}`);

        const usersWithoutPassword = await prisma.user.count({
            where: { password: null }
        });
        console.log(`Users without Password (OTP users): ${usersWithoutPassword}`);

        const usersWithoutEmail = await prisma.user.count({
            where: { 
                OR: [
                    { email: "" },
                    { email: { contains: "@temp.com" } }, // Adjust pattern to your placeholder
                    { email: { contains: "@example.com" } }
                ]
            }
        });
        console.log(`Users with missing or placeholder emails: ${usersWithoutEmail}`);

        const usersWithPhoneOnly = await prisma.user.findMany({
            where: {
                OR: [
                    { email: "" },
                    { email: { contains: "@temp.com" } }
                ]
            },
            select: { id: true, phone: true, email: true }
        });

        if (usersWithPhoneOnly.length > 0) {
            console.log("\nSample users needing email updates:");
            console.table(usersWithPhoneOnly.slice(0, 10));
        }

    } catch (error) {
        console.error("Audit failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

auditUsers();
