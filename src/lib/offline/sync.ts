import { offlineDb } from './db';

/**
 * Replay all queued offline writes (stops + completions) against /api/sync.
 * Returns the total number drained. Safe to call repeatedly.
 */
export async function drainQueue(): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;

  const [stops, completions] = await Promise.all([
    offlineDb.offlineStops.toArray(),
    offlineDb.offlineCompletions.toArray(),
  ]);
  if (stops.length === 0 && completions.length === 0) return 0;

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        stops: stops.map((s) => s.payload),
        completions: completions.map((c) => c.payload),
      }),
    });
    if (!res.ok) return 0;
    await Promise.all([
      offlineDb.offlineStops.bulkDelete(stops.map((s) => s.clientId)),
      offlineDb.offlineCompletions.bulkDelete(completions.map((c) => c.clientId)),
    ]);
    return stops.length + completions.length;
  } catch {
    return 0;
  }
}
