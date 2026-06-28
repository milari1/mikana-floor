import type { ChecklistStandard } from '@/lib/checklist';

import { offlineDb } from './db';

/**
 * Prime the standards cache (called on crew load while online). Active
 * standards are stored so checklists open offline and pin their version.
 */
export async function primeStandardsCache(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  try {
    const res = await fetch('/api/standards');
    if (!res.ok) return;
    const list = (await res.json()) as ChecklistStandard[];
    await offlineDb.cachedStandards.bulkPut(list);
  } catch {
    /* offline / network error — keep whatever is cached */
  }
}

/**
 * Resolve a standard for the checklist: prefer the cache (the version the user
 * saw at shift-on), fall back to the network, and cache the result.
 */
export async function getStandardForChecklist(
  id: string,
): Promise<ChecklistStandard | null> {
  const cached = await offlineDb.cachedStandards.get(id);
  if (cached) return cached;

  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  try {
    const res = await fetch(`/api/standards/${id}`);
    if (!res.ok) return null;
    const standard = (await res.json()) as ChecklistStandard;
    await offlineDb.cachedStandards.put(standard);
    return standard;
  } catch {
    return null;
  }
}
