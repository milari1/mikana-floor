'use client';

import { Check, ChevronLeft, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { submitIntake } from '@/lib/offline/intake';
import {
  EXPECTED_DELIVERIES,
  INTAKE_REJECT_REASONS,
} from '@/lib/quality-types';
import { cn } from '@/lib/utils';

type LineState = 'pending' | 'accepted' | 'rejected';

export default function IntakePage() {
  const [states, setStates] = useState<Record<string, LineState>>({});
  const [rejecting, setRejecting] = useState<{
    key: string;
    supplierId: string | null;
    supplierName: string;
    line: string;
  } | null>(null);

  async function accept(
    key: string,
    supplierId: string | null,
    supplierName: string,
    line: string,
  ) {
    setStates((s) => ({ ...s, [key]: 'accepted' }));
    await submitIntake({ supplierId: supplierId ?? '', supplierName, line, action: 'accept' });
  }

  async function reject(reason: string) {
    if (!rejecting) return;
    const { key, supplierId, supplierName, line } = rejecting;
    setStates((s) => ({ ...s, [key]: 'rejected' }));
    setRejecting(null);
    await submitIntake({
      supplierId: supplierId ?? '',
      supplierName,
      line,
      action: 'reject',
      reason,
    });
  }

  return (
    <main className="flex flex-1 flex-col px-5 pt-6">
      <header className="mb-6 flex items-center gap-2">
        <Link
          href="/crew"
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:bg-slate-200"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Intake</h1>
          <p className="text-sm text-slate-500">Today’s expected deliveries</p>
        </div>
      </header>

      <div className="space-y-6">
        {EXPECTED_DELIVERIES.map((delivery) => (
          <section key={delivery.supplierName}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
              {delivery.supplierName}
            </h2>
            <ul className="space-y-2">
              {delivery.lines.map((line) => {
                const key = `${delivery.supplierName}::${line}`;
                const state = states[key] ?? 'pending';
                return (
                  <li
                    key={key}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200"
                  >
                    <span className="flex-1 text-base font-medium">{line}</span>
                    {state === 'pending' ? (
                      <>
                        <button
                          type="button"
                          aria-label={`Accept ${line}`}
                          onClick={() =>
                            accept(key, delivery.supplierId, delivery.supplierName, line)
                          }
                          className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 text-white active:bg-emerald-700"
                        >
                          <Check className="h-6 w-6" aria-hidden />
                        </button>
                        <button
                          type="button"
                          aria-label={`Reject ${line}`}
                          onClick={() =>
                            setRejecting({
                              key,
                              supplierId: delivery.supplierId,
                              supplierName: delivery.supplierName,
                              line,
                            })
                          }
                          className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-500 active:bg-slate-200"
                        >
                          <X className="h-6 w-6" aria-hidden />
                        </button>
                      </>
                    ) : (
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-sm font-semibold',
                          state === 'accepted'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700',
                        )}
                      >
                        {state === 'accepted' ? 'Accepted' : 'Rejected'}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {rejecting && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40"
          role="dialog"
          aria-modal="true"
          onClick={() => setRejecting(null)}
        >
          <div
            className="w-full space-y-2 rounded-t-3xl bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-2 pb-1 text-sm font-semibold text-slate-500">
              Reject — reason
            </p>
            {INTAKE_REJECT_REASONS.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => reject(r.key)}
                className="flex min-h-[56px] w-full items-center rounded-xl bg-slate-50 px-4 text-left text-base font-medium active:bg-slate-100"
              >
                {r.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRejecting(null)}
              className="flex min-h-[56px] w-full items-center justify-center rounded-xl text-base font-medium text-slate-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
