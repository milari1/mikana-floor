import { and, desc, eq, gte } from 'drizzle-orm';
import { AlertTriangle, ArrowRight, Bot } from 'lucide-react';
import Link from 'next/link';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { qualityEvents, stops } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Mock agent alerts — the app surfaces signals; humans decide.
const AGENT_ALERTS = [
  'Walk-in #2 trending warm over the last hour — consider a temp check.',
  'Cold Prep is 2 steps behind the opening checklist for this time of day.',
];

export default async function GmDashboardPage() {
  const session = await auth();
  const siteId = session?.user?.siteId ?? null;

  if (!siteId) {
    return (
      <p className="text-slate-500">
        No site is associated with your account. The GM dashboard is scoped to a
        single site.
      </p>
    );
  }

  const since = startOfToday();
  const [todayStops, qualityToday] = await Promise.all([
    db
      .select()
      .from(stops)
      .where(and(eq(stops.siteId, siteId), gte(stops.openedAt, since)))
      .orderBy(desc(stops.openedAt)),
    db
      .select({ id: qualityEvents.id })
      .from(qualityEvents)
      .where(and(eq(qualityEvents.siteId, siteId), gte(qualityEvents.createdAt, since))),
  ]);

  const openStops = todayStops.filter((s) => !s.resolved).length;

  // covers / labor / waste have no source tables yet — placeholders.
  const kpis = [
    { label: 'Covers', value: '—', sub: 'target 320' },
    { label: 'Labor', value: '—', sub: 'of plan' },
    { label: 'Open stops', value: String(openStops), sub: `${todayStops.length} today` },
    { label: 'Quality flags', value: String(qualityToday.length), sub: 'today' },
    { label: 'Waste %', value: '—', sub: 'placeholder' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Today</h1>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {kpi.label}
            </p>
            <p className="mt-1 text-3xl font-bold">{kpi.value}</p>
            <p className="text-xs text-slate-400">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Agent alerts */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">
          <Bot className="h-4 w-4" aria-hidden /> Agent alerts
        </h2>
        <ul className="space-y-2">
          {AGENT_ALERTS.map((alert, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
            >
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
                aria-hidden
              />
              <span className="text-sm text-slate-700">{alert}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Today's stops */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
            Today’s stops
          </h2>
          <Link
            href="/gm/stops"
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600"
          >
            Review <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {todayStops.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-sm text-slate-400 ring-1 ring-slate-200">
            No stops today.
          </p>
        ) : (
          <ul className="space-y-2">
            {todayStops.slice(0, 6).map((stop) => (
              <li
                key={stop.id}
                className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
              >
                <div>
                  <p className="font-semibold capitalize">
                    {stop.category.replace('_', ' ')}
                    {stop.subcategory ? ` · ${stop.subcategory.replace(/_/g, ' ')}` : ''}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(stop.openedAt).toLocaleTimeString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    stop.resolved
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {stop.resolved ? 'Closed' : 'Open'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
