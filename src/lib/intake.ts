import 'server-only';

import { db } from './db';
import { intakeEvents } from './db/schema';
import type { IntakePayload } from './quality-types';
import { notifyBuyer } from './push';
import type { StopActor } from './stops';

export async function createIntakeEvent(
  actor: StopActor,
  payload: IntakePayload,
): Promise<{ id: string }> {
  const siteId = actor.siteId;
  if (!siteId) {
    throw new Error('Cannot log intake: user is not assigned to a site.');
  }

  const [row] = await db
    .insert(intakeEvents)
    .values({
      siteId,
      // supplierId must exist in `suppliers`; null is allowed for ad-hoc lines.
      supplierId: payload.supplierId || null,
      receivedBy: actor.id,
      payloadJson: payload,
    })
    .returning({ id: intakeEvents.id });

  // Each accept/reject is a scorecard data point (scorecard is derived from
  // intake_events). Rejections notify the buyer.
  if (payload.action === 'reject') {
    await notifyBuyer(siteId, `intake:${row.id}`);
  }

  return { id: row.id };
}
