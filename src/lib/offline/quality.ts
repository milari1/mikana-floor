import type { QualityPayload } from '@/lib/quality-types';

import { registerReplaySync } from './background-sync';
import { offlineDb } from './db';

export type SubmitQualityResult =
  | { queued: false; stopId: string | null }
  | { queued: true };

export async function enqueueQuality(payload: QualityPayload): Promise<void> {
  await offlineDb.offlineQuality.add({
    clientId: crypto.randomUUID(),
    payload,
    queuedAt: new Date().toISOString(),
  });
  await registerReplaySync();
}

export async function submitQuality(
  payload: QualityPayload,
): Promise<SubmitQualityResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueQuality(payload);
    return { queued: true };
  }
  try {
    const res = await fetch('/api/quality', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Quality POST failed: ${res.status}`);
    const data = (await res.json()) as { stopId?: string | null };
    return { queued: false, stopId: data.stopId ?? null };
  } catch {
    await enqueueQuality(payload);
    return { queued: true };
  }
}
