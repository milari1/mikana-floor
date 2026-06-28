import type { CompletionPayload } from '@/lib/checklist';

import { registerReplaySync } from './background-sync';
import { offlineDb } from './db';

export type SubmitCompletionResult = { queued: boolean };

export async function enqueueCompletion(
  payload: CompletionPayload,
): Promise<void> {
  await offlineDb.offlineCompletions.add({
    clientId: crypto.randomUUID(),
    payload,
    queuedAt: new Date().toISOString(),
  });
  await registerReplaySync();
}

/** Record a step completion. Online: POST; offline / on failure: queue. */
export async function submitCompletion(
  payload: CompletionPayload,
): Promise<SubmitCompletionResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueCompletion(payload);
    return { queued: true };
  }
  try {
    const res = await fetch('/api/standards/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Completion POST failed: ${res.status}`);
    return { queued: false };
  } catch {
    await enqueueCompletion(payload);
    return { queued: true };
  }
}
