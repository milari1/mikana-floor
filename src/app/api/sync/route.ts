import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { createStop } from '@/lib/stops';
import { stopPayloadSchema } from '@/lib/stop-taxonomy';

const syncSchema = z.object({
  stops: z.array(stopPayloadSchema).default([]),
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
  const ids: string[] = [];
  const failed: number[] = [];

  const queued = parsed.data.stops;
  for (let i = 0; i < queued.length; i++) {
    try {
      const { id } = await createStop(actor, queued[i]);
      ids.push(id);
    } catch {
      failed.push(i);
    }
  }

  return NextResponse.json({ synced: ids.length, ids, failed });
}
