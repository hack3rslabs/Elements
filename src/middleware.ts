import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Add security headers to all responses
    const response = NextResponse.next();
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(self)"
    );

    // Protect /admin routes
    if (pathname.startsWith("/admin")) {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET || "elements-dev-secret-change-in-production",
        });

        // Debug: Log token presence (in local dev if possible)
        // console.log("Middleware token:", token?.email, token?.role);

        // Not authenticated — redirect to login
        if (!token) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Authenticated but not authorized role — redirect to denied
        if (token.role !== "ADMIN" && token.role !== "STAFF") {
            const deniedUrl = new URL("/login", request.url);
            deniedUrl.searchParams.set("error", "AccessDenied");
            return NextResponse.redirect(deniedUrl);
        }
    }

    return response;
}

export const config = {
    matcher: [
        "/admin/:path*",
        "/((?!api|_next/static|_next/image|favicon.ico|images|icons|login).*)",
    ],
};

