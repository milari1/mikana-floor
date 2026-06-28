import { desc } from 'drizzle-orm';

import { AuditorView } from '@/components/auditor/AuditorView';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  doctrineDecisions,
  foodSafetyEvents,
  standards,
  stops,
} from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

const LIMIT = 500;

export default async function AuditorPage() {
  // Data-layer enforcement (in addition to middleware): never serve auditor
  // data to a non-auditor, and never accept client-supplied scope filters.
  const session = await auth();
  if (session?.user?.role !== 'auditor') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-100 text-slate-500">
        Read-only auditor access only.
      </main>
    );
  }

  const [stopRows, standardRows, doctrineRows, foodSafetyRows] =
    await Promise.all([
      db
        .select({
          id: stops.id,
          category: stops.category,
          subcategory: stops.subcategory,
          resolved: stops.resolved,
          rootCause: stops.rootCause,
          openedAt: stops.openedAt,
        })
        .from(stops)
        .orderBy(desc(stops.openedAt))
        .limit(LIMIT),
      db
        .select({
          id: standards.id,
          station: standards.station,
          phase: standards.phase,
          version: standards.version,
          effectiveAt: standards.effectiveAt,
        })
        .from(standards)
        .orderBy(desc(standards.version))
        .limit(LIMIT),
      db
        .select({
          id: doctrineDecisions.id,
          title: doctrineDecisions.title,
          tradeOff: doctrineDecisions.tradeOff,
          principle: doctrineDecisions.principle,
          createdAt: doctrineDecisions.createdAt,
        })
        .from(doctrineDecisions)
        .orderBy(desc(doctrineDecisions.createdAt))
        .limit(LIMIT),
      db
        .select({
          id: foodSafetyEvents.id,
          siteId: foodSafetyEvents.siteId,
          payload: foodSafetyEvents.payloadJson,
          createdAt: foodSafetyEvents.createdAt,
        })
        .from(foodSafetyEvents)
        .orderBy(desc(foodSafetyEvents.createdAt))
        .limit(LIMIT),
    ]);

  const toRows = (rows: Record<string, unknown>[]) =>
    rows.map((r) => {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(r)) {
        out[k] =
          v == null
            ? ''
            : v instanceof Date
              ? v.toISOString()
              : typeof v === 'object'
                ? JSON.stringify(v)
                : String(v);
      }
      return out;
    });

  const tables = [
    { key: 'stops', label: 'Stops', rows: toRows(stopRows) },
    { key: 'standards', label: 'Standards versions', rows: toRows(standardRows) },
    { key: 'doctrine', label: 'Doctrine decisions', rows: toRows(doctrineRows) },
    {
      key: 'food_safety',
      label: 'Food safety events',
      rows: toRows(foodSafetyRows),
    },
  ];

  return <AuditorView tables={tables} />;
}
