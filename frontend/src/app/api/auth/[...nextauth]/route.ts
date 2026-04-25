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
const providers: NextAuthOptions["providers"] = [
    CredentialsProvider({
        name: "Mobile OTP",
        credentials: {
            phone: { label: "Phone", type: "text" },
            otp: { label: "OTP", type: "text" },
            type: { label: "Type", type: "text" },
        },
        async authorize(credentials) {
            console.log("[NextAuth] authorize called:", {
                phone: credentials?.phone,
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

            console.log("[NextAuth] No matching credentials");
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
