import 'server-only';

import { db } from './db';
import { qualityEvents } from './db/schema';
import type { QualityPayload } from './quality-types';
import { createStop, type StopActor } from './stops';

export async function createQualityEvent(
  actor: StopActor,
  payload: QualityPayload,
): Promise<{ id: string; stopId: string | null }> {
  const siteId = actor.siteId;
  if (!siteId) {
    throw new Error('Cannot log quality: user is not assigned to a site.');
  }

  const [row] = await db
    .insert(qualityEvents)
    .values({
      siteId,
      reportedBy: actor.id,
      payloadJson: payload,
    })
    .returning({ id: qualityEvents.id });

  // Escalation is a human choice; when chosen it opens a stop.
  let stopId: string | null = null;
  if (payload.action === 'escalate') {
    const stop = await createStop(actor, {
      category: 'quality',
      subcategory: payload.category,
      detail:
        payload.detail ??
        `Escalated from quality check${
          payload.recipeName ? ` — ${payload.recipeName}` : ''
        }`,
      openedAt: payload.createdAt ?? new Date().toISOString(),
    });
    stopId = stop.id;
  }

  return { id: row.id, stopId };
}
