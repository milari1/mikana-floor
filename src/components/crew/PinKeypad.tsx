'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Delete } from 'lucide-react';

import { cn } from '@/lib/utils';

type SiteOption = { id: string; name: string };

const PIN_LENGTH = 4;
// Touch targets: floor use on phones in gloves. 56pt ≈ 74.6px; we use 80px keys.
const KEY_CLASS =
  'flex h-20 min-h-[80px] items-center justify-center rounded-xl bg-slate-800 ' +
  'text-2xl font-semibold text-slate-50 transition active:scale-95 active:bg-slate-700 ' +
  'disabled:opacity-40';

export function PinKeypad({
  sites,
  callbackUrl = '/crew',
}: {
  sites: SiteOption[];
  callbackUrl?: string;
}) {
  const router = useRouter();
  const [siteId, setSiteId] = useState<string>(sites[0]?.id ?? '');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(
    async (value: string) => {
      setSubmitting(true);
      setError(null);
      const result = await signIn('crew-pin', {
        siteId,
        pin: value,
        redirect: false,
      });
      if (result?.error) {
        setError('Incorrect PIN for this site. Try again.');
        setPin('');
        setSubmitting(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    },
    [siteId, callbackUrl, router],
  );

  // Auto-submit once a full PIN is entered.
  useEffect(() => {
    if (pin.length === PIN_LENGTH && !submitting) {
      void submit(pin);
    }
  }, [pin, submitting, submit]);

  const press = (digit: string) => {
    if (submitting) return;
    setError(null);
    setPin((prev) => (prev.length < PIN_LENGTH ? prev + digit : prev));
  };

  const backspace = () => {
    if (submitting) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-slate-950 px-6 py-10 text-slate-50">
      <div className="w-full max-w-xs space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Shift On</h1>
        <p className="text-sm text-slate-400">
          Select your site and enter your 4-digit PIN.
        </p>
      </div>

      <label className="w-full max-w-xs space-y-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Site
        </span>
        <select
          aria-label="Site"
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          disabled={submitting}
          className="h-14 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-lg text-slate-50 focus:border-slate-400 focus:outline-none"
        >
          {sites.length === 0 && <option value="">No sites available</option>}
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      {/* PIN dots */}
      <div className="flex items-center justify-center gap-4" aria-hidden>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-4 w-4 rounded-full border-2 border-slate-600 transition',
              i < pin.length && 'border-slate-50 bg-slate-50',
            )}
          />
        ))}
      </div>

      <div
        className="h-5 text-center text-sm text-red-400"
        role="alert"
        aria-live="polite"
      >
        {error}
      </div>

      {/* Keypad */}
      <div className="grid w-full max-w-xs grid-cols-3 gap-3">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            disabled={submitting || !siteId}
            className={KEY_CLASS}
            aria-label={`Digit ${k}`}
          >
            {k}
          </button>
        ))}
        <span aria-hidden />
        <button
          type="button"
          onClick={() => press('0')}
          disabled={submitting || !siteId}
          className={KEY_CLASS}
          aria-label="Digit 0"
        >
          0
        </button>
        <button
          type="button"
          onClick={backspace}
          disabled={submitting || pin.length === 0}
          className={cn(KEY_CLASS, 'bg-slate-900')}
          aria-label="Delete last digit"
        >
          <Delete className="h-7 w-7" />
        </button>
      </div>
    </main>
  );
}
