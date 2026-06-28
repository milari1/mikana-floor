import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getStandard } from '@/lib/standards';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const standard = await getStandard(params.id);
  if (!standard) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(standard);
}
