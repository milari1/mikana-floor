'use client';

import { useEffect } from 'react';

import { drainStops } from '@/lib/offline/sync';

/**
 * Drains the offline stop queue on mount and whenever the device comes back
 * online. Renders nothing. (Prompt 8 adds a Service Worker Background Sync
 * path and the visible offline/queue-depth indicator.)
 */
export function CrewOfflineSync() {
  useEffect(() => {
    const run = () => {
      void drainStops();
    };
    run();
    window.addEventListener('online', run);
    return () => window.removeEventListener('online', run);
  }, []);

  return null;
}
