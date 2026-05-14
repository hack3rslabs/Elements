import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";

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

            if (credentials?.type === "user") {
                const { email: rawEmail, password, name: rawName, phone: rawPhone } = credentials;
                if (!password || !rawEmail) return null;

                const email = rawEmail.trim().toLowerCase();
                const customerName = rawName?.trim() || null;
                const phone = rawPhone?.trim() || null;

                try {
                    let user = await prisma.user.findUnique({ where: { email } });

                    if (!user) {
                        // Optional: Separate registration flow is better, but keeping auto-register if that's the current pattern
                        const hashedPassword = await bcrypt.hash(password, 10);
                        user = await prisma.user.create({
                            data: {
                                email,
                                password: hashedPassword,
                                name: customerName || email.split('@')[0] || 'User',
                                phone: phone,
                                role: 'USER'
                            }
                        });
                    } else {
                        if (!user.password) {
                            const hashedPassword = await bcrypt.hash(password, 10);
                            user = await prisma.user.update({
                                where: { id: user.id },
                                data: { password: hashedPassword }
                            });
                        } else {
                            const isMatch = await bcrypt.compare(password, user.password);
                            if (!isMatch) return null;
                        }

                        // Update name or phone if provided and currently missing
                        if ((customerName && !user.name) || (phone && !user.phone)) {
                            user = await prisma.user.update({
                                where: { id: user.id },
                                data: { 
                                    ...(customerName && !user.name ? { name: customerName } : {}),
                                    ...(phone && !user.phone ? { phone: phone } : {})
                                }
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

            if (credentials?.type === "admin") {
                const { email, otp } = credentials;
                if (!email || !otp) return null;

                const otpRecord = await prisma.verificationOTP.findUnique({
                    where: { identifier: email }
                });

                if (!otpRecord || otpRecord.otp !== otp || otpRecord.expiresAt < new Date()) {
                    return null;
                }

                await prisma.verificationOTP.delete({ where: { identifier: email } });

                const adminUser = await prisma.user.findUnique({ where: { email } });

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
    secret: process.env.NEXTAUTH_SECRET || "elements-dev-secret-change-in-production",
};
