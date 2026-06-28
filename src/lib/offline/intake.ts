import type { IntakePayload } from '@/lib/quality-types';

import { registerReplaySync } from './background-sync';
import { offlineDb } from './db';

export type SubmitIntakeResult = { queued: boolean };

export async function enqueueIntake(payload: IntakePayload): Promise<void> {
  await offlineDb.offlineIntake.add({
    clientId: crypto.randomUUID(),
    payload,
    queuedAt: new Date().toISOString(),
  });
  await registerReplaySync();
}

export async function submitIntake(
  payload: IntakePayload,
): Promise<SubmitIntakeResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueIntake(payload);
    return { queued: true };
  }
  try {
    const res = await fetch('/api/intake', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Intake POST failed: ${res.status}`);
    return { queued: false };
  } catch {
    await enqueueIntake(payload);
    return { queued: true };
  }
}
