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
            name: { label: "Name", type: "text" },
            phone: { label: "Phone", type: "text" },
            password: { label: "Password", type: "password" },
            email: { label: "Email", type: "text" },
            otp: { label: "OTP", type: "text" },
            type: { label: "Type", type: "text" },
        },
        async authorize(credentials) {
            if (!prisma) return null;

            // 1. Handle Regular User (Email + Phone + Password)
            if (credentials?.type === "user") {
                const { email: rawEmail, phone: rawPhone, password, name: rawName } = credentials;
                if (!password || (!rawEmail && !rawPhone)) return null;

                const email = rawEmail ? rawEmail.trim().toLowerCase() : null;
                const phone = rawPhone ? rawPhone.replace(/\D/g, '').slice(-10) : null;
                const customerName = rawName?.trim() || null;
                const formattedPhone = phone ? `+91${phone}` : null;

                console.log(`[AUTH] User Login Attempt: ${email || formattedPhone}`);

                try {
                    // Try to find user by email or phone
                    let user = await prisma.user.findFirst({
                        where: {
                            OR: [
                                ...(email ? [{ email }] : []),
                                ...(formattedPhone ? [{ phone: formattedPhone }] : [])
                            ]
                        }
                    });

                    if (!user) {
                        // AUTO-REGISTRATION
                        if (!email || !formattedPhone) {
                            console.log(`[AUTH] Auto-registration failed: Missing email or phone`);
                            return null;
                        }

                        console.log(`[AUTH] Auto-registering new user: ${email} / ${formattedPhone}`);
                        const hashedPassword = await bcrypt.hash(password, 10);
                        user = await prisma.user.create({
                            data: {
                                email,
                                phone: formattedPhone,
                                password: hashedPassword,
                                name: customerName || email?.split('@')[0] || 'User',
                                role: 'USER'
                            }
                        });
                    } else {
                        console.log(`[AUTH] Existing user found: ${user.email}`);

                        // Verify password
                        if (!user.password) {
                            // Migrate passwordless user
                            console.log(`[AUTH] Migrating passwordless user: ${user.email}`);
                            const hashedPassword = await bcrypt.hash(password, 10);
                            user = await prisma.user.update({
                                where: { id: user.id },
                                data: { 
                                    password: hashedPassword,
                                    // Update phone if provided and currently null
                                    ...(formattedPhone && !user.phone ? { phone: formattedPhone } : {})
                                }
                            });
                        } else {
                            const isMatch = await bcrypt.compare(password, user.password);
                            if (!isMatch) {
                                console.log(`[AUTH] Password mismatch for: ${user.email}`);
                                return null;
                            }
                        }

                        // Update name if user provided one and current name is missing/placeholder
                        if (customerName && (!user.name || user.name === user.email?.split('@')[0])) {
                            user = await prisma.user.update({
                                where: { id: user.id },
                                data: { name: customerName }
                            });
                        }

                        // Ensure role is USER for this path
                        if (user.role !== 'USER' && user.role !== 'ADMIN' && user.role !== 'STAFF') {
                            await prisma.user.update({
                                where: { id: user.id },
                                data: { role: 'USER' }
                            });
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
        jwt: ({ token, user, trigger, session }) => {
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
            if (trigger === "update" && session) {
                return { ...token, ...session.user };
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
