import bcrypt from 'bcryptjs';
import { and, eq } from 'drizzle-orm';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Resend from 'next-auth/providers/resend';

import { authConfig } from './auth.config';
import { drizzleMagicLinkAdapter } from './auth-adapter';
import { db } from './db';
import { users } from './db/schema';
import { MAGIC_LINK_ROLES, type Role } from './roles';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: drizzleMagicLinkAdapter,
  providers: [
    /**
     * Crew PIN: a site is chosen and a 4-digit PIN entered on a shared device.
     * Look up active users at that site and bcrypt-compare the PIN to pin_hash.
     */
    Credentials({
      id: 'crew-pin',
      name: 'Crew PIN',
      credentials: {
        siteId: { label: 'Site', type: 'text' },
        pin: { label: 'PIN', type: 'password' },
      },
      async authorize(credentials) {
        const siteId =
          typeof credentials?.siteId === 'string' ? credentials.siteId : '';
        const pin =
          typeof credentials?.pin === 'string' ? credentials.pin : '';
        if (!siteId || !/^\d{4}$/.test(pin)) return null;

        const candidates = await db
          .select()
          .from(users)
          .where(and(eq(users.siteId, siteId), eq(users.active, true)));

        for (const u of candidates) {
          if (u.pinHash && bcrypt.compareSync(pin, u.pinHash)) {
            return {
              id: u.id,
              email: u.email,
              name: u.name,
              role: u.role,
              siteId: u.siteId,
            };
          }
        }
        return null;
      },
    }),

    /** Magic link for GM and above (and auditor), delivered via Resend. */
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.AUTH_RESEND_FROM ?? 'onboarding@resend.dev',
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Gate the magic link to email-eligible roles only.
    async signIn({ user, account }) {
      if (account?.provider === 'resend') {
        const role = (user as { role?: Role }).role;
        return !!role && MAGIC_LINK_ROLES.has(role);
      }
      return true;
    },
  },
});
