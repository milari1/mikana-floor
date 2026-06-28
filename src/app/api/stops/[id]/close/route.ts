import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stops } from '@/lib/db/schema';
import { atLeast, type Role } from '@/lib/roles';

const closeSchema = z.object({
  // A root cause is REQUIRED before a stop can be closed.
  rootCause: z.string().trim().min(1, 'Root cause is required'),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const role = session.user.role as Role | undefined;
  if (!role || !atLeast(role, 'mod')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = closeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Root cause is required to close a stop.' },
      { status: 400 },
    );
  }

  const siteId = session.user.siteId;
  const updated = await db
    .update(stops)
    .set({
      resolved: true,
      rootCause: parsed.data.rootCause,
      resolvedBy: session.user.id!,
      resolvedAt: new Date(),
    })
    .where(
      siteId
        ? and(eq(stops.id, params.id), eq(stops.siteId, siteId))
        : eq(stops.id, params.id),
    )
    .returning({ id: stops.id });

  if (updated.length === 0) {
    return NextResponse.json({ error: 'Stop not found' }, { status: 404 });
  }
  return NextResponse.json({ id: updated[0].id });
}
