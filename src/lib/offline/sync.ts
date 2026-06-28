import { offlineDb } from './db';

/**
 * Replay all queued offline writes (stops, completions, quality, intake)
 * against /api/sync. Returns the total number drained. Safe to call repeatedly.
 */
export async function drainQueue(): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;

  const [stops, completions, quality, intake] = await Promise.all([
    offlineDb.offlineStops.toArray(),
    offlineDb.offlineCompletions.toArray(),
    offlineDb.offlineQuality.toArray(),
    offlineDb.offlineIntake.toArray(),
  ]);
  const total = stops.length + completions.length + quality.length + intake.length;
  if (total === 0) return 0;

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        stops: stops.map((s) => s.payload),
        completions: completions.map((c) => c.payload),
        quality: quality.map((q) => q.payload),
        intake: intake.map((i) => i.payload),
      }),
    });
    if (!res.ok) return 0;
    await Promise.all([
      offlineDb.offlineStops.bulkDelete(stops.map((s) => s.clientId)),
      offlineDb.offlineCompletions.bulkDelete(completions.map((c) => c.clientId)),
      offlineDb.offlineQuality.bulkDelete(quality.map((q) => q.clientId)),
      offlineDb.offlineIntake.bulkDelete(intake.map((i) => i.clientId)),
    ]);
    return total;
  } catch {
    return 0;
  }
}
