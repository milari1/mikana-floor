'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

type Stop = {
  id: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  station: string | null;
  openedAt: string;
};

export default function GmStopsPage() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rootCause, setRootCause] = useState('');
  const [closing, setClosing] = useState(false);

  async function load() {
    const res = await fetch('/api/stops?status=open');
    if (res.ok) setStops(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function close(id: string) {
    if (!rootCause.trim() || closing) return;
    setClosing(true);
    const res = await fetch(`/api/stops/${id}/close`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rootCause: rootCause.trim() }),
    });
    if (res.ok) {
      setStops((prev) => prev.filter((s) => s.id !== id));
      setExpanded(null);
      setRootCause('');
    }
    setClosing(false);
  }

  if (loading) return <p className="text-slate-500">Loading stops…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Open stops</h1>

      {stops.length === 0 ? (
        <p className="rounded-2xl bg-white p-4 text-sm text-slate-400 ring-1 ring-slate-200">
          No open stops. Nice and steady.
        </p>
      ) : (
        <ul className="space-y-3">
          {stops.map((stop) => {
            const isOpen = expanded === stop.id;
            return (
              <li
                key={stop.id}
                className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
              >
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(isOpen ? null : stop.id);
                    setRootCause('');
                  }}
                  className="flex w-full items-center justify-between p-4 text-left"
                  aria-expanded={isOpen}
                >
                  <div>
                    <p className="font-semibold capitalize">
                      {stop.category.replace('_', ' ')}
                      {stop.subcategory
                        ? ` · ${stop.subcategory.replace(/_/g, ' ')}`
                        : ''}
                    </p>
                    <p className="text-xs text-slate-400">
                      {stop.station ? `${stop.station} · ` : ''}
                      {new Date(stop.openedAt).toLocaleString()}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-slate-400 transition',
                      isOpen && 'rotate-180',
                    )}
                    aria-hidden
                  />
                </button>

                {isOpen && (
                  <div className="space-y-3 border-t border-slate-100 p-4">
                    {stop.description && (
                      <p className="text-sm text-slate-600">{stop.description}</p>
                    )}
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Root cause (required to close)
                      </span>
                      <textarea
                        value={rootCause}
                        onChange={(e) => setRootCause(e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={closing || rootCause.trim().length === 0}
                      onClick={() => close(stop.id)}
                      className="min-h-[44px] rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white active:bg-slate-800 disabled:opacity-40"
                    >
                      {closing ? 'Closing…' : 'Close stop'}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
