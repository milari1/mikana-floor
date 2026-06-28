'use client';

import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

type Table = {
  key: string;
  label: string;
  rows: Record<string, string>[];
};

function toCsv(rows: Record<string, string>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? '')).join(',')),
  ];
  return lines.join('\n');
}

export function AuditorView({ tables }: { tables: Table[] }) {
  const [activeKey, setActiveKey] = useState(tables[0]?.key);
  const [filter, setFilter] = useState('');

  const active = tables.find((t) => t.key === activeKey) ?? tables[0];

  const filtered = useMemo(() => {
    if (!filter.trim()) return active.rows;
    const q = filter.toLowerCase();
    return active.rows.filter((r) =>
      Object.values(r).some((v) => v.toLowerCase().includes(q)),
    );
  }, [active, filter]);

  const headers = filtered[0] ? Object.keys(filtered[0]) : [];

  function exportCsv() {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active.key}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-8 py-4">
          <span className="text-lg font-bold tracking-tight">
            Mikana Floor <span className="text-slate-400">· Auditor</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex flex-wrap gap-1">
            {tables.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setActiveKey(t.key);
                  setFilter('');
                }}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium',
                  t.key === active.key
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter…"
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white active:bg-slate-800"
            >
              <Download className="h-4 w-4" aria-hidden />
              CSV
            </button>
          </div>
        </div>

        <div className="overflow-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row, i) => (
                <tr key={i}>
                  {headers.map((h) => (
                    <td key={h} className="max-w-xs truncate px-4 py-2">
                      {row[h]}
                    </td>
                  ))}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-400" colSpan={headers.length || 1}>
                    No rows.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
