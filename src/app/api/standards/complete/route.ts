import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { completionPayloadSchema } from '@/lib/checklist';
import { createCompletion } from '@/lib/standards';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = completionPayloadSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid completion', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = await createCompletion(
    { id: session.user.id!, siteId: session.user.siteId },
    parsed.data,
  );
  return NextResponse.json({ id }, { status: 201 });
}
