import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import bcrypt from "bcryptjs";

// Build providers list dynamically
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = PrismaAdapter(prisma as any);
const providers: NextAuthOptions["providers"] = [
    CredentialsProvider({
        name: "Credentials",
        credentials: {
            phone: { label: "Phone", type: "text" },
            password: { label: "Password", type: "password" },
            email: { label: "Email", type: "text" },
            otp: { label: "OTP", type: "text" },
            type: { label: "Type", type: "text" },
        },
        async authorize(credentials) {
            if (!prisma) return null;

            // 1. Handle Regular User (Phone + Password)
            if (credentials?.type === "user") {
                const { phone: rawPhone, password } = credentials;
                if (!rawPhone || !password) return null;

                const phone = rawPhone.replace(/\D/g, '').slice(-10); // Get last 10 digits only
                const formattedPhone = `+91${phone}`;

                console.log(`[AUTH] User Login: ${formattedPhone}`);

                try {
                    let user = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { phone: formattedPhone },
                                { phone: phone },
                                { email: `${phone}@elements.com` }
                            ]
                        }
                    });

                    if (!user) {
                        console.log(`[AUTH] Creating new user: ${formattedPhone}`);
                        const hashedPassword = await bcrypt.hash(password, 10);
                        user = await prisma.user.create({
                            data: {
                                phone: formattedPhone,
                                password: hashedPassword,
                                name: `User ${phone.slice(-4)}`,
                                email: `${phone}@elements.com`,
                                role: 'USER'
                            }
                        });
                    } else {
                        console.log(`[AUTH] Existing user found: ${user.phone || user.email}`);
                        
                        // Security: Force USER role for all phone-based logins
                        if (user.role !== 'USER') {
                            console.log(`[AUTH] Downgrading ${user.phone} from ${user.role} to USER`);
                            user = await prisma.user.update({
                                where: { id: user.id },
                                data: { role: 'USER' }
                            });
                        }

                        // Handle password-less users (migrating)
                        if (!user.password) {
                            console.log(`[AUTH] Setting password for existing user`);
                            const hashedPassword = await bcrypt.hash(password, 10);
                            user = await prisma.user.update({
                                where: { id: user.id },
                                data: { password: hashedPassword, phone: formattedPhone }
                            });
                        } else {
                            // Verify password
                            const isMatch = await bcrypt.compare(password, user.password);
                            if (!isMatch) {
                                console.log(`[AUTH] Password mismatch`);
                                return null;
                            }
                        }
                    }

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                        permissions: user.permissions || []
                    };
                } catch (error) {
                    console.error("[AUTH] Fatal Login Error:", error);
                    return null;
                }
            }

            // 2. Handle Admin (Email + OTP)
            if (credentials?.type === "admin") {
                const { email, otp } = credentials;
                if (!email || !otp) return null;

                // Verify OTP in DB
                const otpRecord = await prisma.verificationOTP.findUnique({
                    where: { identifier: email }
                });

                if (!otpRecord || otpRecord.otp !== otp || otpRecord.expiresAt < new Date()) {
                    return null;
                }

                // Delete OTP after successful verification
                await prisma.verificationOTP.delete({
                    where: { identifier: email }
                });

                const adminUser = await prisma.user.findUnique({
                    where: { email }
                });

                if (!adminUser) return null;

                return {
                    id: adminUser.id,
                    name: adminUser.name,
                    email: adminUser.email,
                    phone: adminUser.phone,
                    role: adminUser.role,
                    permissions: adminUser.permissions
                };
            }

            return null;
        },
    })
];

export const authOptions: NextAuthOptions = {
    ...(adapter ? { adapter } : {}),
    session: {
        strategy: "jwt",
    },
    providers,
    callbacks: {
        session: ({ session, token }) => {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.id,
                    role: token.role,
                    phone: token.phone,
                    staffRole: token.staffRole,
                    permissions: token.permissions,
                },
            };
        },
        jwt: ({ token, user }) => {
            if (user) {
                const u = user as unknown as { id: string; role: string; phone: string; staffRole?: string; permissions?: string[] };
                return {
                    ...token,
                    id: u.id,
                    role: u.role,
                    phone: u.phone,
                    staffRole: u.staffRole || 'admin',
                    permissions: u.permissions || ['all'],
                };
            }
            return token;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret:
        process.env.NEXTAUTH_SECRET ||
        "elements-dev-secret-change-in-production",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
