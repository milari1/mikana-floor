import 'server-only';

import { desc, eq } from 'drizzle-orm';

import type { ChecklistStandard, CompletionPayload, StandardStep } from './checklist';
import { db } from './db';
import { standardCompletions, standards } from './db/schema';
import { findSiteMod, notifyMod } from './push';
import type { StopActor } from './stops';

function toChecklistStandard(row: typeof standards.$inferSelect): ChecklistStandard {
  return {
    id: row.id,
    station: row.station,
    phase: row.phase,
    title: row.title,
    version: row.version,
    bodyMd: row.bodyMd,
    photoUrl: row.photoUrl,
    steps: (row.stepsJson as StandardStep[] | null) ?? [],
  };
}

export async function getStandard(id: string): Promise<ChecklistStandard | null> {
  const rows = await db.select().from(standards).where(eq(standards.id, id));
  return rows[0] ? toChecklistStandard(rows[0]) : null;
}

/** Latest version per station+phase (the "active" standard for each surface). */
export async function listActiveStandards(): Promise<ChecklistStandard[]> {
  const rows = await db.select().from(standards).orderBy(desc(standards.version));
  const seen = new Set<string>();
  const active: ChecklistStandard[] = [];
  for (const row of rows) {
    const key = `${row.station}::${row.phase ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    active.push(toChecklistStandard(row));
  }
  return active;
}

export async function createCompletion(
  actor: StopActor,
  payload: CompletionPayload,
): Promise<{ id: string }> {
  const [row] = await db
    .insert(standardCompletions)
    .values({
      standardId: payload.standardId,
      standardVersion: payload.standardVersion,
      stepIndex: payload.stepIndex ?? null,
      stepName: payload.stepName ?? null,
      status: payload.status,
      reason: payload.reason ?? null,
      userId: actor.id,
      siteId: actor.siteId ?? null,
      completedAt: payload.completedAt ? new Date(payload.completedAt) : new Date(),
    })
    .returning({ id: standardCompletions.id });

  // "Needs help" escalates to the MOD (humans decide).
  if (payload.status === 'needs_help' && actor.siteId) {
    const mod = await findSiteMod(actor.siteId);
    await notifyMod(mod, `completion:${row.id}`);
  }

  return { id: row.id };
}
