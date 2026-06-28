import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createIntakeEvent } from '@/lib/intake';
import { intakePayloadSchema } from '@/lib/quality-types';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = intakePayloadSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid intake event', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createIntakeEvent(
    { id: session.user.id!, siteId: session.user.siteId },
    parsed.data,
  );
  return NextResponse.json(result, { status: 201 });
}
