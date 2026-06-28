import { and, eq } from 'drizzle-orm';
import type { Adapter, AdapterUser } from 'next-auth/adapters';

import { db } from './db';
import { users, verificationTokens } from './db/schema';

/**
 * Minimal Auth.js adapter — just enough for the email magic-link flow with JWT
 * sessions. Only verification-token persistence and user lookup are backed by
 * the database; account/session storage is intentionally omitted (JWT sessions
 * need no session table, and users are provisioned out-of-band, not via
 * self-registration).
 */
function toAdapterUser(u: typeof users.$inferSelect): AdapterUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    emailVerified: null,
    // extra fields carried through to the JWT/session callbacks
    role: u.role,
    siteId: u.siteId,
  } as AdapterUser;
}

export const drizzleMagicLinkAdapter: Adapter = {
  async createVerificationToken(token) {
    await db.insert(verificationTokens).values({
      identifier: token.identifier,
      token: token.token,
      expires: token.expires,
    });
    return token;
  },

  async useVerificationToken({ identifier, token }) {
    const rows = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, token),
        ),
      );
    const vt = rows[0];
    if (!vt) return null;

    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, token),
        ),
      );

    return { identifier: vt.identifier, token: vt.token, expires: vt.expires };
  },

  async getUserByEmail(email) {
    const rows = await db.select().from(users).where(eq(users.email, email));
    return rows[0] ? toAdapterUser(rows[0]) : null;
  },

  async getUser(id) {
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0] ? toAdapterUser(rows[0]) : null;
  },

  async createUser() {
    // Self-registration is disabled. Users are provisioned via seed/admin.
    throw new Error(
      'Account provisioning is disabled. Contact an administrator for access.',
    );
  },
};
