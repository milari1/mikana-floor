import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { completionPayloadSchema } from '@/lib/checklist';
import { createIntakeEvent } from '@/lib/intake';
import { createQualityEvent } from '@/lib/quality';
import {
  intakePayloadSchema,
  qualityPayloadSchema,
} from '@/lib/quality-types';
import { createCompletion } from '@/lib/standards';
import { createStop } from '@/lib/stops';
import { stopPayloadSchema } from '@/lib/stop-taxonomy';

const syncSchema = z.object({
  stops: z.array(stopPayloadSchema).default([]),
  completions: z.array(completionPayloadSchema).default([]),
  quality: z.array(qualityPayloadSchema).default([]),
  intake: z.array(intakePayloadSchema).default([]),
});

/**
 * Reconcile offline-queued writes on reconnect. Currently drains the crew
 * stop queue; future offline-capable writes (quality, intake) extend this.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = syncSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid sync payload', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const actor = { id: session.user.id!, siteId: session.user.siteId };
  const stopIds: string[] = [];
  const completionIds: string[] = [];

  const queuedStops = parsed.data.stops;
  for (let i = 0; i < queuedStops.length; i++) {
    try {
      const { id } = await createStop(actor, queuedStops[i]);
      stopIds.push(id);
    } catch {
      /* skip failed item */
    }
  }

  const queuedCompletions = parsed.data.completions;
  for (let i = 0; i < queuedCompletions.length; i++) {
    try {
      const { id } = await createCompletion(actor, queuedCompletions[i]);
      completionIds.push(id);
    } catch {
      /* skip failed item */
    }
  }

  const qualityIds: string[] = [];
  const queuedQuality = parsed.data.quality;
  for (let i = 0; i < queuedQuality.length; i++) {
    try {
      const { id } = await createQualityEvent(actor, queuedQuality[i]);
      qualityIds.push(id);
    } catch {
      /* skip failed item */
    }
  }

  const intakeIds: string[] = [];
  const queuedIntake = parsed.data.intake;
  for (let i = 0; i < queuedIntake.length; i++) {
    try {
      const { id } = await createIntakeEvent(actor, queuedIntake[i]);
      intakeIds.push(id);
    } catch {
      /* skip failed item */
    }
  }

  return NextResponse.json({
    synced:
      stopIds.length +
      completionIds.length +
      qualityIds.length +
      intakeIds.length,
    stops: stopIds,
    completions: completionIds,
    quality: qualityIds,
    intake: intakeIds,
  });
}
