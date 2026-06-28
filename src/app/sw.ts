import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { NetworkOnly, Serwist, StaleWhileRevalidate } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Active standards: serve fast, refresh in the background.
      matcher: ({ url }) => url.pathname.startsWith('/api/standards'),
      handler: new StaleWhileRevalidate({ cacheName: 'api-standards' }),
    },
    {
      // Sync must always hit the network.
      matcher: ({ url }) => url.pathname.startsWith('/api/sync'),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
});

// Background Sync: when the "replay-queue" tag fires, ask open clients to drain
// their Dexie queue (the drain logic + IndexedDB access live in the client).
self.addEventListener('sync', (event) => {
  const e = event as ExtendableEvent & { tag?: string };
  if (e.tag !== 'replay-queue') return;
  e.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
      });
      for (const client of clients) client.postMessage({ type: 'replay-queue' });
    })(),
  );
});

serwist.addEventListeners();
