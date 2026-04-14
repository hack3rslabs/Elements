import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            staffRole?: string;
            permissions?: string[];
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role: string;
        staffRole?: string;
        permissions?: string[];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        staffRole?: string;
        permissions?: string[];
    }
}
