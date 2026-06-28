import { and, eq } from 'drizzle-orm';

import { db } from './db';
import { users } from './db/schema';
import { sendPushToUser } from './web-push';

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
  await sendPushToUser(mod.id, {
    title: 'Line stopped',
    body: 'A crew member raised a stop. Tap to review.',
    url: '/gm/stops',
  });
}

/** Notify the site MOD of an intake rejection (buyer escalation surfaces there). */
export async function notifyBuyer(siteId: string, ref: string): Promise<void> {
  const mod = await findSiteMod(siteId);
  if (!mod) {
    console.warn(`[push] No MOD to notify for intake ${ref}`);
    return;
  }
  await sendPushToUser(mod.id, {
    title: 'Intake rejected',
    body: 'A delivery line was rejected. Review the supplier scorecard.',
    url: '/gm',
  });
}
