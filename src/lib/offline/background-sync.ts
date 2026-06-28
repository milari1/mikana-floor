/**
 * Register the "replay-queue" Background Sync tag so the Service Worker can
 * drain the offline queue when connectivity returns — even if the app isn't in
 * the foreground. No-op where Background Sync is unsupported (the `online`
 * event drain in CrewOfflineSync still covers those browsers).
 */
export async function registerReplaySync(): Promise<void> {
  try {
    if (typeof navigator === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) return;
    const reg = await navigator.serviceWorker.ready;
    await (
      reg as unknown as { sync: { register(tag: string): Promise<void> } }
    ).sync.register('replay-queue');
  } catch {
    /* ignore */
  }
}
