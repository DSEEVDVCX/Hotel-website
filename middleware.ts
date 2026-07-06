import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Edge-safe auth instance: built from the provider-less config so the Node-only
// sign-in logic (Prisma + firebase-admin) is never bundled into middleware.
const { auth } = NextAuth(authConfig);

const protectedPaths: Record<string, string[]> = {
  "/bookings": ["GUEST"],
  "/booking": ["GUEST"],
  "/admin": ["ADMIN"],
};

const authRoutes = ["/login", "/register", "/admin/login"];

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const userRole = (session?.user as { role?: string } | undefined)?.role;

  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (isLoggedIn) {
      const home = userRole === "ADMIN" ? "/admin" : "/account";
      return NextResponse.redirect(new URL(home, nextUrl));
    }
    return NextResponse.next();
  }

  for (const [prefix, allowedRoles] of Object.entries(protectedPaths)) {
    if (pathname.startsWith(prefix)) {
      if (!isLoggedIn) {
        // Admin area bounces to the admin portal; buyer areas to the buyer login.
        const loginPath = prefix === "/admin" ? "/admin/login" : "/login";
        const loginUrl = new URL(loginPath, nextUrl);
        loginUrl.searchParams.set("callbackUrl", `${pathname}${nextUrl.search}`);
        return NextResponse.redirect(loginUrl);
      }
      if (!userRole || !allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL("/", nextUrl));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
