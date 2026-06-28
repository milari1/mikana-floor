'use client';

import { CloudOff } from 'lucide-react';
import { useEffect, useState } from 'react';

import { offlineQueueDepth } from '@/lib/offline/db';

/** Top-right chip shown when offline, with the pending write count. */
export function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [depth, setDepth] = useState(0);

  useEffect(() => {
    const update = async () => {
      setOnline(navigator.onLine);
      try {
        setDepth(await offlineQueueDepth());
      } catch {
        /* ignore */
      }
    };
    void update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    const interval = setInterval(update, 4000);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      clearInterval(interval);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="fixed right-3 top-3 z-50 flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
    >
      <CloudOff className="h-4 w-4" aria-hidden />
      Offline{depth > 0 ? ` · ${depth} queued` : ''}
    </div>
  );
}
