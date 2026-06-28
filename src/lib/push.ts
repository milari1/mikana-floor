import { and, eq } from 'drizzle-orm';

import { db } from './db';
import { users } from './db/schema';

export type SiteMod = { id: string; name: string } | null;

/** Find the active Manager-on-Duty for a site (the stop escalation target). */
export async function findSiteMod(siteId: string): Promise<SiteMod> {
  const rows = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(
      and(
        eq(users.siteId, siteId),
        eq(users.role, 'mod'),
        eq(users.active, true),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Notify the MOD of a new stop.
 *
 * TODO(Prompt 9): send a real Web Push using VAPID + stored subscriptions.
 * Push-subscription storage and VAPID wiring land with the GM surface; until
 * then this is a best-effort no-op so the stop flow works end-to-end.
 */
export async function notifyMod(mod: SiteMod, stopId: string): Promise<void> {
  if (!mod) {
    console.warn(`[push] No MOD found to notify for stop ${stopId}`);
    return;
  }
  console.info(`[push] (stub) would notify MOD ${mod.name} about stop ${stopId}`);
}

/**
 * Notify the buyer of an intake rejection.
 * TODO(Prompt 9): real Web Push once subscriptions + VAPID are wired.
 */
export async function notifyBuyer(siteId: string, ref: string): Promise<void> {
  console.info(`[push] (stub) would notify buyer for site ${siteId} about ${ref}`);
}
