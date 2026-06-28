import Dexie, { type Table } from 'dexie';

import type { ChecklistStandard, CompletionPayload } from '@/lib/checklist';
import type { StopPayload } from '@/lib/stop-taxonomy';

export interface OfflineStop {
  clientId: string;
  payload: StopPayload;
  queuedAt: string;
}

export interface OfflineCompletion {
  clientId: string;
  payload: CompletionPayload;
  queuedAt: string;
}

/**
 * Client-side offline store (IndexedDB via Dexie).
 * - offlineStops / offlineCompletions: writes queued while offline, replayed
 *   against /api/sync on reconnect.
 * - cachedStandards: active standards primed on crew load so checklists work
 *   offline and pin the version the user saw.
 */
class MikanaOfflineDb extends Dexie {
  offlineStops!: Table<OfflineStop, string>;
  offlineCompletions!: Table<OfflineCompletion, string>;
  cachedStandards!: Table<ChecklistStandard, string>;

  constructor() {
    super('mikana-floor');
    this.version(1).stores({
      offlineStops: 'clientId, queuedAt',
    });
    this.version(2).stores({
      offlineStops: 'clientId, queuedAt',
      offlineCompletions: 'clientId, queuedAt',
      cachedStandards: 'id, station',
    });
  }
}

export const offlineDb = new MikanaOfflineDb();

export async function offlineStopCount(): Promise<number> {
  return offlineDb.offlineStops.count();
}

export async function offlineQueueDepth(): Promise<number> {
  const [stops, completions] = await Promise.all([
    offlineDb.offlineStops.count(),
    offlineDb.offlineCompletions.count(),
  ]);
  return stops + completions;
}
