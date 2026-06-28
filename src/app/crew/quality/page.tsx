'use client';

import { CheckCircle2, ChevronLeft, Delete, Octagon } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { submitQuality } from '@/lib/offline/quality';
import {
  QUALITY_CATEGORIES,
  type QualityAction,
  type QualityCategory,
  RECIPES,
} from '@/lib/quality-types';
import { cn } from '@/lib/utils';

type Step = 'category' | 'entry' | 'done';

export default function QualityPage() {
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<QualityCategory | null>(null);
  const [recipeId, setRecipeId] = useState<string>(RECIPES[0].id);
  const [actual, setActual] = useState('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ queued: boolean; escalated: boolean } | null>(null);

  const recipe = useMemo(
    () => RECIPES.find((r) => r.id === recipeId) ?? RECIPES[0],
    [recipeId],
  );
  const actualNum = actual === '' ? null : Number(actual);
  const variance =
    actualNum !== null && category === 'portion' ? actualNum - recipe.spec : null;

  function pickCategory(key: QualityCategory) {
    setCategory(key);
    setStep('entry');
  }

  function press(d: string) {
    setActual((prev) => {
      if (d === '.' && prev.includes('.')) return prev;
      return (prev + d).slice(0, 6);
    });
  }

  async function act(action: QualityAction) {
    if (!category || submitting) return;
    setSubmitting(true);
    const res = await submitQuality({
      category,
      recipeId: category === 'portion' ? recipe.id : null,
      recipeName: category === 'portion' ? recipe.name : null,
      recipeVersion: category === 'portion' ? recipe.version : null,
      spec: category === 'portion' ? recipe.spec : null,
      actual: actualNum,
      variance,
      action,
      detail: detail.trim() || null,
      createdAt: new Date().toISOString(),
    });
    setResult({ queued: res.queued, escalated: action === 'escalate' });
    setStep('done');
    setSubmitting(false);
  }

  if (step === 'done' && result) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" aria-hidden />
        </span>
        <h1 className="text-3xl font-bold tracking-tight">
          {result.escalated ? 'Escalated' : 'Logged'}
        </h1>
        <p className="mt-3 max-w-xs text-slate-500">
          {result.queued
            ? 'Saved on this device and will sync when you’re back online.'
            : result.escalated
              ? 'A stop was opened and the manager on duty notified.'
              : 'Quality check recorded.'}
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

  if (step === 'category') {
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
            <h1 className="text-2xl font-bold tracking-tight">Quality check</h1>
            <p className="text-sm text-slate-500">What are you checking?</p>
          </div>
        </header>
        <div className="grid gap-3">
          {QUALITY_CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => pickCategory(key)}
              className="flex min-h-[64px] items-center rounded-2xl bg-white px-5 text-left text-lg font-semibold shadow-sm ring-1 ring-slate-200 active:scale-[0.99] active:bg-slate-50"
            >
              {label}
            </button>
          ))}
        </div>
      </main>
    );
  }

  // entry
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

  return (
    <main className="flex flex-1 flex-col px-5 pt-6">
      <header className="mb-4 flex items-center gap-2">
        <button
          type="button"
          aria-label="Back"
          onClick={() => setStep('category')}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:bg-slate-200"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden />
        </button>
        <h1 className="text-2xl font-bold capitalize tracking-tight">
          {category}
        </h1>
      </header>

      {category === 'portion' && (
        <>
          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Recipe
            </span>
            <select
              aria-label="Recipe"
              value={recipeId}
              onChange={(e) => setRecipeId(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base"
            >
              {RECIPES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (v{r.version})
                </option>
              ))}
            </select>
          </label>

          <div className="mb-3 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Spec</p>
              <p className="text-xl font-bold">
                {recipe.spec} {recipe.unit}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Actual
              </p>
              <p className="text-xl font-bold">
                {actual || '—'} {recipe.unit}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Variance
              </p>
              <p
                className={cn(
                  'text-xl font-bold',
                  variance !== null && variance !== 0
                    ? 'text-amber-600'
                    : 'text-slate-700',
                )}
              >
                {variance === null
                  ? '—'
                  : `${variance > 0 ? '+' : ''}${variance} ${recipe.unit}`}
              </p>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            {keys.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => press(k)}
                className="flex h-14 items-center justify-center rounded-xl bg-white text-xl font-semibold shadow-sm ring-1 ring-slate-200 active:bg-slate-50"
              >
                {k}
              </button>
            ))}
            <button
              type="button"
              aria-label="Delete"
              onClick={() => setActual((p) => p.slice(0, -1))}
              className="flex h-14 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200 active:bg-slate-50"
            >
              <Delete className="h-6 w-6" aria-hidden />
            </button>
          </div>
        </>
      )}

      {category !== 'portion' && (
        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Note (optional)
          </span>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base focus:border-slate-400 focus:outline-none"
          />
        </label>
      )}

      <div className="mt-auto grid gap-3 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => act('recalibrate')}
            className="min-h-[56px] rounded-2xl bg-slate-100 text-base font-semibold text-slate-700 active:bg-slate-200 disabled:opacity-50"
          >
            Recalibrate
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => act('log')}
            className="min-h-[56px] rounded-2xl bg-slate-900 text-base font-semibold text-white active:bg-slate-800 disabled:opacity-50"
          >
            Log
          </button>
        </div>
        <button
          type="button"
          disabled={submitting}
          onClick={() => act('escalate')}
          className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-red-600 text-base font-semibold text-white active:bg-red-700 disabled:opacity-50"
        >
          <Octagon className="h-5 w-5" aria-hidden />
          Escalate to stop
        </button>
      </div>
    </main>
  );
}
