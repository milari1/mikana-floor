import type { NextAuthConfig } from 'next-auth';

import type { Role } from './roles';

/**
 * Edge-safe Auth.js configuration.
 *
 * This module must NOT import anything that can't run on the edge runtime
 * (no bcrypt, no database client). It holds the session strategy and the
 * JWT/session callbacks so that `middleware.ts` can build a lightweight
 * NextAuth instance to read the session. The real providers and the adapter
 * are attached in `auth.ts` (Node runtime only).
 */
export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: '/crew/shift-on',
  },
  providers: [], // attached in auth.ts
  callbacks: {
    // Persist role + site onto the JWT at sign-in.
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.siteId = user.siteId ?? null;
      }
      return token;
    },
    // Expose role + site on the session object.
    session({ session, token }) {
      if (token.role) session.user.role = token.role as Role;
      session.user.siteId = (token.siteId as string | null | undefined) ?? null;
      return session;
    },
  },
} satisfies NextAuthConfig;
