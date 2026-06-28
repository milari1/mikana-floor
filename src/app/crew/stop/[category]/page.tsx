'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useState } from 'react';

import { BigButton } from '@/components/crew/BigButton';
import { StopConfirmation } from '@/components/crew/StopConfirmation';
import { submitStop, type SubmitStopResult } from '@/lib/offline/stops';
import {
  categoryLabel,
  isStopCategory,
  STOP_SUBCATEGORIES,
} from '@/lib/stop-taxonomy';

export default function StopSubcategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitStopResult | null>(null);

  if (!isStopCategory(params.category)) notFound();
  const category = params.category;
  const subs = STOP_SUBCATEGORIES[category];

  async function choose(subcategory: string | null) {
    if (submitting) return;
    setSubmitting(true);
    // Confirmation renders inline (no navigation) so it works offline too.
    const res = await submitStop({
      category,
      subcategory,
      detail: detail.trim() || null,
      openedAt: new Date().toISOString(),
    });
    setResult(res);
  }

  if (result) {
    return (
      <StopConfirmation
        queued={result.queued}
        modName={result.queued ? null : result.modName}
      />
    );
  }

  return (
    <main className="flex flex-1 flex-col px-5 pt-6">
      <header className="mb-5 flex items-center gap-2">
        <Link
          href="/crew/stop"
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:bg-slate-200"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {categoryLabel(category)}
          </h1>
          <p className="text-sm text-slate-500">Pick what fits best.</p>
        </div>
      </header>

      {/* Optional detail (text). Voice capture is added in a later prompt. */}
      <label className="mb-5 block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Add detail (optional)
        </span>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          disabled={submitting}
          rows={2}
          placeholder="Anything the MOD should know"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base focus:border-slate-400 focus:outline-none"
        />
      </label>

      {subs.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {subs.map((sub) => (
            <button
              key={sub.key}
              type="button"
              disabled={submitting}
              onClick={() => choose(sub.key)}
              className="flex min-h-[72px] items-center justify-center rounded-2xl bg-white px-4 py-4 text-center text-base font-semibold shadow-sm ring-1 ring-slate-200 transition active:scale-[0.98] active:bg-slate-50 disabled:opacity-50"
            >
              {sub.label}
            </button>
          ))}
        </div>
      ) : (
        <BigButton block disabled={submitting} onClick={() => choose(null)}>
          Log this stop
        </BigButton>
      )}
    </main>
  );
}
