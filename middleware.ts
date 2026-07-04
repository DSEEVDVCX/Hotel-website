import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPaths: Record<string, string[]> = {
  "/bookings": ["GUEST"],
  "/booking": ["GUEST"],
  "/dashboard": ["HOTELIER"],
  "/admin": ["ADMIN"],
};

const authRoutes = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;
  const userRole = token?.role as string | undefined;

  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  for (const [prefix, allowedRoles] of Object.entries(protectedPaths)) {
    if (pathname.startsWith(prefix)) {
      if (!isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
      if (!userRole || !allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL("/", nextUrl));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
