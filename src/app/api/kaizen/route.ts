import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { kaizenItems } from '@/lib/db/schema';

const kaizenSchema = z.object({
  rawText: z.string().min(1),
  // Audio is never retained by crew capture; only the GM huddle may flip this.
  audioRetain: z.boolean().default(false),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const siteId = session.user.siteId;
  if (!siteId) {
    return NextResponse.json(
      { error: 'User is not assigned to a site.' },
      { status: 400 },
    );
  }

  const parsed = kaizenSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid kaizen', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [row] = await db
    .insert(kaizenItems)
    .values({
      siteId,
      rawText: parsed.data.rawText,
      audioRetain: parsed.data.audioRetain,
      status: 'open',
      proposedBy: session.user.id!,
    })
    .returning({ id: kaizenItems.id });

  return NextResponse.json({ id: row.id }, { status: 201 });
}
