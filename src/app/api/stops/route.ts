import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stops } from '@/lib/db/schema';
import { createStop } from '@/lib/stops';
import { stopPayloadSchema } from '@/lib/stop-taxonomy';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = stopPayloadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid stop', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { id, modName } = await createStop(
      { id: session.user.id!, siteId: session.user.siteId },
      parsed.data,
    );
    return NextResponse.json(
      { id, mod: modName ? { name: modName } : null },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create stop' },
      { status: 400 },
    );
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const siteId = session.user.siteId;
  if (!siteId) return NextResponse.json([]);

  const status = new URL(req.url).searchParams.get('status');
  const filters = [eq(stops.siteId, siteId)];
  if (status === 'open') filters.push(eq(stops.resolved, false));
  if (status === 'closed') filters.push(eq(stops.resolved, true));

  const rows = await db
    .select()
    .from(stops)
    .where(and(...filters))
    .orderBy(desc(stops.openedAt));

  return NextResponse.json(rows);
}
