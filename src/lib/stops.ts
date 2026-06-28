import 'server-only';

import { db } from './db';
import { stops } from './db/schema';
import { findSiteMod, notifyMod } from './push';
import type { StopPayload } from './stop-taxonomy';

export type StopActor = { id: string; siteId?: string | null };

export type CreateStopResult = { id: string; modName: string | null };

/**
 * Insert a stop, look up the site MOD, and fire the (stubbed) push.
 * Shared by POST /api/stops and the offline-replay POST /api/sync.
 *
 * The acting user and site come from the authenticated session — never the
 * client payload — so a crew member can only raise stops for their own site.
 */
export async function createStop(
  actor: StopActor,
  payload: StopPayload,
): Promise<CreateStopResult> {
  const siteId = actor.siteId;
  if (!siteId) {
    throw new Error('Cannot raise a stop: user is not assigned to a site.');
  }

  const [row] = await db
    .insert(stops)
    .values({
      siteId,
      shiftId: payload.shiftId ?? null,
      station: payload.station ?? null,
      category: payload.category,
      subcategory: payload.subcategory ?? null,
      description: payload.detail ?? null,
      openedAt: payload.openedAt ? new Date(payload.openedAt) : new Date(),
      raisedBy: actor.id,
    })
    .returning({ id: stops.id });

  const mod = await findSiteMod(siteId);
  await notifyMod(mod, row.id);

  return { id: row.id, modName: mod?.name ?? null };
}
