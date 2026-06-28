'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DoctrineForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [rationale, setRationale] = useState('');
  const [tradeOff, setTradeOff] = useState('');
  const [principle, setPrinciple] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!title.trim() || !rationale.trim() || !tradeOff.trim()) {
      setError('Title, rationale, and trade-off are all required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/doctrine', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        rationale: rationale.trim(),
        tradeOff: tradeOff.trim(),
        principle: principle ? Number(principle) : null,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError('Could not save the decision.');
      return;
    }
    setTitle('');
    setRationale('');
    setTradeOff('');
    setPrinciple('');
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
    >
      <h2 className="text-lg font-semibold">New decision</h2>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Decision"
        className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-400 focus:outline-none"
      />
      <textarea
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
        placeholder="Rationale"
        rows={2}
        className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-400 focus:outline-none"
      />
      <textarea
        value={tradeOff}
        onChange={(e) => setTradeOff(e.target.value)}
        placeholder="Trade-off accepted (required)"
        rows={2}
        className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-400 focus:outline-none"
      />
      <input
        value={principle}
        onChange={(e) => setPrinciple(e.target.value)}
        placeholder="Principle # (1–14, optional)"
        inputMode="numeric"
        className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-400 focus:outline-none"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="min-h-[44px] rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white active:bg-slate-800 disabled:opacity-40"
      >
        {submitting ? 'Saving…' : 'Record decision'}
      </button>
    </form>
  );
}
