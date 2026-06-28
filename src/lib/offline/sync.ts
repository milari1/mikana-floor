import { offlineDb } from './db';

/**
 * Replay queued offline stops against /api/sync. Returns the number drained.
 * Safe to call repeatedly (on mount and on every `online` event).
 */
export async function drainStops(): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;

  const items = await offlineDb.offlineStops.toArray();
  if (items.length === 0) return 0;

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ stops: items.map((i) => i.payload) }),
    });
    if (!res.ok) return 0;
    await offlineDb.offlineStops.bulkDelete(items.map((i) => i.clientId));
    return items.length;
  } catch {
    return 0;
  }
}
