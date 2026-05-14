import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedSuperAdmin() {
    // --- EDIT THESE DETAILS ---
    const adminEmail = "admin@hindustan-elements.com"; // Your admin email
    const adminPassword = "SecurePassword123!";       // Your admin password
    const adminName = "Super Admin";
    // ---------------------------

    console.log(`--- Seeding Super Admin: ${adminEmail} ---`);

    try {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const admin = await prisma.user.upsert({
            where: { email: adminEmail },
            update: {
                role: 'ADMIN',
                password: hashedPassword,
                permissions: ['all'],
                name: adminName
            },
            create: {
                email: adminEmail,
                name: adminName,
                password: hashedPassword,
                role: 'ADMIN',
                permissions: ['all']
            }
        });

        console.log("Successfully created/updated Super Admin!");
        console.log("Details:");
        console.log(`- ID: ${admin.id}`);
        console.log(`- Email: ${admin.email}`);
        console.log(`- Role: ${admin.role}`);
        console.log(`- Permissions: ${JSON.stringify(admin.permissions)}`);

    } catch (error) {
        console.error("Seeding failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seedSuperAdmin();
