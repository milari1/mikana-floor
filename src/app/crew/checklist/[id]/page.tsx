'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ChecklistStep } from '@/components/crew/ChecklistStep';
import { PhotoViewer } from '@/components/crew/PhotoViewer';
import type { ChecklistStandard, CompletionStatus } from '@/lib/checklist';
import { submitCompletion } from '@/lib/offline/completions';
import { getStandardForChecklist } from '@/lib/offline/standards';

type StepStatus = CompletionStatus | 'pending';

export default function ChecklistPage({
  params,
}: {
  params: { id: string };
}) {
  const [standard, setStandard] = useState<ChecklistStandard | null>(null);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<Record<number, StepStatus>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [photo, setPhoto] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    let active = true;
    getStandardForChecklist(params.id).then((s) => {
      if (active) {
        setStandard(s);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [params.id]);

  async function handleComplete(
    index: number,
    step: { name: string },
    status: CompletionStatus,
    reason?: string,
  ) {
    if (!standard) return;
    setBusy(index);
    // Version is pinned to the standard the user opened — a mid-shift version
    // push does not change an in-progress checklist.
    await submitCompletion({
      standardId: standard.id,
      standardVersion: standard.version,
      stepIndex: index,
      stepName: step.name,
      status,
      reason: reason ?? null,
      completedAt: new Date().toISOString(),
    });
    setStatuses((prev) => ({ ...prev, [index]: status }));
    setBusy(null);
  }

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 text-slate-400">
        Loading checklist…
      </main>
    );
  }

  if (!standard) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-slate-500">
          This checklist isn’t available offline yet. Reconnect and try again.
        </p>
        <Link href="/crew" className="mt-6 font-semibold text-sky-600">
          Back to Today
        </Link>
      </main>
    );
  }

  const doneCount = Object.values(statuses).filter((s) => s !== 'pending').length;

  return (
    <main className="flex flex-1 flex-col px-5 pt-6">
      <header className="mb-4 flex items-center gap-2">
        <Link
          href="/crew"
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:bg-slate-200"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold leading-tight tracking-tight">
            {standard.title ?? standard.station}
          </h1>
          <p className="text-sm text-slate-500">
            {standard.station}
            {standard.phase ? ` · ${standard.phase}` : ''} · v{standard.version}
          </p>
        </div>
      </header>

      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="text-slate-500">Progress</span>
        <span className="font-semibold text-slate-700">
          {doneCount}/{standard.steps.length}
        </span>
      </div>

      <ul className="space-y-3">
        {standard.steps.map((step, i) => (
          <ChecklistStep
            key={i}
            step={step}
            index={i}
            status={statuses[i] ?? 'pending'}
            busy={busy === i}
            onComplete={(status, reason) =>
              handleComplete(i, step, status, reason)
            }
            onViewPhoto={(src, alt) => setPhoto({ src, alt })}
          />
        ))}
        {standard.steps.length === 0 && (
          <li className="rounded-2xl bg-white p-4 text-sm text-slate-400 ring-1 ring-slate-200">
            This standard has no steps yet.
          </li>
        )}
      </ul>

      {photo && (
        <PhotoViewer
          src={photo.src}
          alt={photo.alt}
          onClose={() => setPhoto(null)}
        />
      )}
    </main>
  );
}
