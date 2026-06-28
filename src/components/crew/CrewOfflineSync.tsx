'use client';

import { useEffect } from 'react';

import { primeStandardsCache } from '@/lib/offline/standards';
import { drainQueue } from '@/lib/offline/sync';

/**
 * On crew load and whenever the device comes back online: drain the offline
 * write queue (stops + completions) and prime the standards cache so
 * checklists work offline. Renders nothing. (Prompt 8 adds Background Sync and
 * the visible offline/queue-depth indicator.)
 */
export function CrewOfflineSync() {
  useEffect(() => {
    const run = () => {
      void drainQueue();
      void primeStandardsCache();
    };
    run();
    window.addEventListener('online', run);

    // The Service Worker's Background Sync handler asks clients to drain.
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'replay-queue') void drainQueue();
    };
    navigator.serviceWorker?.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('online', run);
      navigator.serviceWorker?.removeEventListener('message', onMessage);
    };
  }, []);

  return null;
}
