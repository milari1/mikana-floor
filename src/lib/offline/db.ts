import Dexie, { type Table } from 'dexie';

import type { StopPayload } from '@/lib/stop-taxonomy';

export interface OfflineStop {
  clientId: string;
  payload: StopPayload;
  queuedAt: string;
}

/**
 * Client-side offline store (IndexedDB via Dexie). Writes made while offline
 * are queued here and replayed against /api/sync on reconnect.
 */
class MikanaOfflineDb extends Dexie {
  offlineStops!: Table<OfflineStop, string>;

  constructor() {
    super('mikana-floor');
    this.version(1).stores({
      offlineStops: 'clientId, queuedAt',
    });
  }
}

export const offlineDb = new MikanaOfflineDb();

export async function offlineStopCount(): Promise<number> {
  return offlineDb.offlineStops.count();
}
