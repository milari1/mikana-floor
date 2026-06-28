import { CheckCircle2, CloudOff } from 'lucide-react';
import Link from 'next/link';

/**
 * Stop confirmation screen. Rendered inline (no navigation) so it works even
 * when the device is offline. No penalty/blame wording — staff are experts.
 */
export function StopConfirmation({
  queued,
  modName,
}: {
  queued: boolean;
  modName: string | null;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <span
        className={`mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
          queued
            ? 'bg-slate-100 text-slate-500'
            : 'bg-emerald-100 text-emerald-600'
        }`}
      >
        {queued ? (
          <CloudOff className="h-10 w-10" aria-hidden />
        ) : (
          <CheckCircle2 className="h-10 w-10" aria-hidden />
        )}
      </span>

      <h1 className="text-3xl font-bold tracking-tight">Stop logged</h1>

      <p className="mt-3 max-w-xs text-slate-500">
        {queued
          ? 'Saved on this device. It will send to the manager on duty as soon as you’re back online.'
          : modName
            ? `${modName} (Manager on Duty) has been notified and is on the way.`
            : 'The manager on duty has been notified.'}
      </p>

      <p className="mt-4 max-w-xs text-sm font-medium text-slate-400">
        Thanks for the catch.
      </p>

      <Link
        href="/crew"
        className="mt-10 inline-flex min-h-[56px] w-full max-w-xs items-center justify-center rounded-2xl bg-slate-900 px-6 text-lg font-semibold text-white active:bg-slate-800"
      >
        Done
      </Link>
    </main>
  );
}
