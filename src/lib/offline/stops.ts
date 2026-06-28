import type { StopPayload } from '@/lib/stop-taxonomy';

import { offlineDb } from './db';

export type SubmitStopResult =
  | { queued: false; modName: string | null }
  | { queued: true };

export async function enqueueStop(payload: StopPayload): Promise<void> {
  await offlineDb.offlineStops.add({
    clientId: crypto.randomUUID(),
    payload,
    queuedAt: new Date().toISOString(),
  });
}

/**
 * Submit a stop. Online: POST /api/stops and return the MOD name. Offline (or
 * on network failure): queue to IndexedDB for replay and report `queued`.
 */
export async function submitStop(
  payload: StopPayload,
): Promise<SubmitStopResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueStop(payload);
    return { queued: true };
  }

  try {
    const res = await fetch('/api/stops', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Stop POST failed: ${res.status}`);
    const data = (await res.json()) as { mod?: { name: string } | null };
    return { queued: false, modName: data.mod?.name ?? null };
  } catch {
    // Network blip after the online check — don't lose the stop.
    await enqueueStop(payload);
    return { queued: true };
  }
}
