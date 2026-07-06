import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";

/**
 * Edge-safe NextAuth config shared by the middleware and the full server auth.
 *
 * It intentionally contains NO providers and NO Node-only imports (Prisma,
 * firebase-admin, bcrypt). The middleware only needs to DECODE the JWT and run
 * the callbacks to expose `role`/`id` on the session — it never signs anyone in.
 *
 * The full sign-in logic (Credentials provider that reads Firebase/Postgres and
 * verifies passwords) lives in lib/auth.ts, which spreads this config and adds
 * `providers`. Keeping providers out of here is what prevents firebase-admin's
 * `node:crypto`/`node:fs`/`node:https` imports from being bundled into the Edge
 * runtime (which forbids them).
 */
export const authConfig = {
  trustHost: true,
  secret:
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "sewar-al-andalus-auth-secret-change-in-vercel-production",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: UserRole }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: UserRole }).role = token.role as UserRole;
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
