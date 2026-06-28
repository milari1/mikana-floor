import { asc } from 'drizzle-orm';

import { PinKeypad } from '@/components/crew/PinKeypad';
import { db } from '@/lib/db';
import { sites } from '@/lib/db/schema';

// Reads from the database per request; never statically prerendered.
export const dynamic = 'force-dynamic';

export default async function ShiftOnPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const siteOptions = await db
    .select({ id: sites.id, name: sites.name })
    .from(sites)
    .orderBy(asc(sites.name));

  return (
    <PinKeypad sites={siteOptions} callbackUrl={searchParams.callbackUrl ?? '/crew'} />
  );
}
