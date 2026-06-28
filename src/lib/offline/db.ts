import Dexie, { type Table } from 'dexie';

import type { ChecklistStandard, CompletionPayload } from '@/lib/checklist';
import type { IntakePayload, QualityPayload } from '@/lib/quality-types';
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

export interface OfflineQuality {
  clientId: string;
  payload: QualityPayload;
  queuedAt: string;
}

export interface OfflineIntake {
  clientId: string;
  payload: IntakePayload;
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
  offlineQuality!: Table<OfflineQuality, string>;
  offlineIntake!: Table<OfflineIntake, string>;
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
    this.version(3).stores({
      offlineStops: 'clientId, queuedAt',
      offlineCompletions: 'clientId, queuedAt',
      offlineQuality: 'clientId, queuedAt',
      offlineIntake: 'clientId, queuedAt',
      cachedStandards: 'id, station',
    });
  }
}

export const offlineDb = new MikanaOfflineDb();

export async function offlineStopCount(): Promise<number> {
  return offlineDb.offlineStops.count();
}

export async function offlineQueueDepth(): Promise<number> {
  const [stops, completions, quality, intake] = await Promise.all([
    offlineDb.offlineStops.count(),
    offlineDb.offlineCompletions.count(),
    offlineDb.offlineQuality.count(),
    offlineDb.offlineIntake.count(),
  ]);
  return stops + completions + quality + intake;
}
