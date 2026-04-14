import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

// Only import PrismaAdapter if prisma is available
let adapter: NextAuthOptions["adapter"] = undefined;
if (prisma) {
    const { PrismaAdapter } = require("@next-auth/prisma-adapter");
    adapter = PrismaAdapter(prisma);
}

// Build providers list dynamically
const providers: NextAuthOptions["providers"] = [];

// Only add Google if real credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const GoogleProvider = require("next-auth/providers/google").default;
    providers.push(
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })
    );
}

// Always add Credentials provider
providers.push(
    CredentialsProvider({
        name: "Credentials",
        credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
            phone: { label: "Phone", type: "text" },
            otp: { label: "OTP", type: "text" },
            type: { label: "Type", type: "text" },
        },
        async authorize(credentials) {
            console.log("[NextAuth] authorize called:", {
                email: credentials?.email,
                type: credentials?.type,
            });

            // Handle Mobile + OTP Login
            if (credentials?.type === "mobile") {
                if (!credentials.phone || !credentials.otp) return null;
                try {
                    const res = await fetch(
                        "http://localhost:5000/api/auth/otp/verify",
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                phone: credentials.phone,
                                otp: credentials.otp,
                            }),
                        }
                    );
                    const data = await res.json();
                    if (data.success) return data.user;
                } catch {
                    return null;
                }
                return null;
            }

            // Handle Standard Email + Password Login
            if (!credentials?.email || !credentials?.password) {
                console.log("[NextAuth] Missing email or password");
                return null;
            }

            // Try staff login via backend first
            try {
                const staffRes = await fetch(
                    "http://localhost:5000/api/auth/staff/login",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    }
                );
                const staffData = await staffRes.json();
                if (staffData.success && staffData.user) {
                    console.log("[NextAuth] Staff login successful:", staffData.user.email, staffData.user.role);
                    const roleMap: Record<string, string> = { admin: 'ADMIN', manager: 'ADMIN', staff: 'STAFF', viewer: 'STAFF' };
                    return {
                        id: staffData.user.id,
                        email: staffData.user.email,
                        name: staffData.user.name,
                        role: roleMap[staffData.user.role] || 'STAFF',
                        staffRole: staffData.user.role,
                        permissions: staffData.user.permissions,
                    };
                }
            } catch (e) {
                console.log("[NextAuth] Staff login error:", e);
            }

            // If database is available, check against DB
            if (prisma) {
                try {
                    const { compare } = require("bcryptjs");
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email },
                    });

                    if (user && user.password) {
                        const isPasswordValid = await compare(
                            credentials.password,
                            user.password
                        );
                        if (!isPasswordValid) return null;
                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            role: user.role,
                        };
                    }
                } catch (e) {
                    console.log("[NextAuth] DB error:", e);
                }
            }

            // Demo credentials fallback
            if (
                credentials.email === "admin@elements.com" &&
                credentials.password === "password123"
            ) {
                console.log("[NextAuth] Demo admin login successful");
                return {
                    id: "admin-1",
                    email: "admin@elements.com",
                    name: "Admin",
                    role: "ADMIN",
                    staffRole: "admin",
                    permissions: ['dashboard', 'products', 'orders', 'crm', 'payments', 'banners', 'tasks', 'campaigns', 'reports', 'integrations', 'staff', 'seo', 'settings'],
                };
            }

            console.log("[NextAuth] No matching credentials");
            return null;
        },
    })
);

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
                    staffRole: token.staffRole,
                    permissions: token.permissions,
                },
            };
        },
        jwt: ({ token, user }) => {
            if (user) {
                const u = user as unknown as { id: string; role: string; staffRole?: string; permissions?: string[] };
                return {
                    ...token,
                    id: u.id,
                    role: u.role,
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
