import { desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { doctrineDecisions } from '@/lib/db/schema';
import { atLeast, type Role } from '@/lib/roles';

const doctrineSchema = z.object({
  title: z.string().trim().min(1),
  rationale: z.string().trim().min(1),
  // The trade-off is required — every doctrine decision accepts a cost.
  tradeOff: z.string().trim().min(1, 'Trade-off is required'),
  principle: z.number().int().min(1).max(14).nullish(),
});

function requireDirector(role: Role | undefined): boolean {
  return !!role && atLeast(role, 'director');
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !requireDirector(session.user.role as Role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const rows = await db
    .select()
    .from(doctrineDecisions)
    .orderBy(desc(doctrineDecisions.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !requireDirector(session.user.role as Role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = doctrineSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid decision', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [row] = await db
    .insert(doctrineDecisions)
    .values({
      title: parsed.data.title,
      rationale: parsed.data.rationale,
      tradeOff: parsed.data.tradeOff,
      principle: parsed.data.principle ?? null,
      decidedBy: session.user.id!,
    })
    .returning({ id: doctrineDecisions.id });

  return NextResponse.json({ id: row.id }, { status: 201 });
}
