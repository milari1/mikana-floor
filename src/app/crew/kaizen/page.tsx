'use client';

import { CheckCircle2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { BigButton } from '@/components/crew/BigButton';
import { VoiceCapture } from '@/components/crew/VoiceCapture';

export default function KaizenPage() {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    const rawText = text.trim();
    if (!rawText || submitting) return;
    setSubmitting(true);
    try {
      // audio_retain is always false from crew capture (humans decide retention
      // later, in the GM huddle).
      await fetch('/api/kaizen', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rawText, audioRetain: false }),
      });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" aria-hidden />
        </span>
        <h1 className="text-3xl font-bold tracking-tight">Logged</h1>
        <p className="mt-3 max-w-xs text-slate-500">
          Will surface in the next huddle.
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
          <h1 className="text-2xl font-bold tracking-tight">Kaizen</h1>
          <p className="text-sm text-slate-500">An idea to make the work better?</p>
        </div>
      </header>

      <div className="my-6">
        <VoiceCapture
          onResult={(t) => setText((prev) => (prev ? `${prev} ${t}` : t))}
        />
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Transcript (edit if needed)
        </span>
        <textarea
          aria-label="Kaizen idea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={submitting}
          rows={4}
          placeholder="Hold the mic and talk, or type your idea here."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base focus:border-slate-400 focus:outline-none"
        />
      </label>

      <BigButton
        block
        variant="primary"
        className="mt-5"
        disabled={submitting || text.trim().length === 0}
        onClick={submit}
      >
        {submitting ? 'Logging…' : 'Log idea'}
      </BigButton>
    </main>
  );
}
