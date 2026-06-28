import { desc } from 'drizzle-orm';

import { DoctrineForm } from '@/components/director/DoctrineForm';
import { db } from '@/lib/db';
import { doctrineDecisions } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export default async function DoctrinePage() {
  const decisions = await db
    .select()
    .from(doctrineDecisions)
    .orderBy(desc(doctrineDecisions.createdAt));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Doctrine decisions</h1>
        {decisions.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-sm text-slate-400 ring-1 ring-slate-200">
            No decisions recorded yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {decisions.map((d) => (
              <li
                key={d.id}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{d.title}</h3>
                  {d.principle != null && (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      Principle {d.principle}
                    </span>
                  )}
                </div>
                {d.rationale && (
                  <p className="mt-2 text-sm text-slate-600">{d.rationale}</p>
                )}
                {d.tradeOff && (
                  <p className="mt-2 text-sm">
                    <span className="font-semibold text-amber-700">
                      Trade-off:{' '}
                    </span>
                    <span className="text-slate-600">{d.tradeOff}</span>
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(d.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <DoctrineForm />
    </div>
  );
}
