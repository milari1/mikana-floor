import {
  ChevronRight,
  ClipboardList,
  Clock,
  Info,
  Thermometer,
} from 'lucide-react';

import { BigButton } from '@/components/crew/BigButton';

// --- Mock data (wired to real shift/standards tables in a later prompt) --------
const TODAY = {
  name: 'Casey',
  station: 'Cold Prep',
  shift: { label: 'AM Shift', time: '6:00 AM – 2:00 PM' },
  now: {
    task: 'Opening Checklist',
    subtitle: 'Sanitation first · 8 steps',
    done: 0,
    total: 8,
  },
  next: { task: 'Line setup', time: '8:30 AM' },
  alerts: [
    {
      id: '1',
      Icon: Thermometer,
      tone: 'warn' as const,
      text: 'Walk-in #2 reading 41°F — recheck before prep',
      time: '12m ago',
    },
    {
      id: '2',
      Icon: Info,
      tone: 'info' as const,
      text: 'Cold Prep standard updated to v3 — takes effect next shift',
      time: '1h ago',
    },
  ],
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const toneStyles = {
  warn: 'bg-amber-50 text-amber-700 ring-amber-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
} as const;

export default function CrewTodayPage() {
  const { name, station, shift, now, next, alerts } = TODAY;

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pb-4 pt-8">
      {/* Header */}
      <header className="space-y-1">
        <p className="text-sm text-slate-500">{greeting()},</p>
        <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
        <div className="flex flex-wrap items-center gap-2 pt-1 text-sm">
          <span className="rounded-full bg-slate-900 px-3 py-1 font-medium text-white">
            {station}
          </span>
          <span className="inline-flex items-center gap-1 text-slate-500">
            <Clock className="h-4 w-4" aria-hidden />
            {shift.label} · {shift.time}
          </span>
        </div>
      </header>

      {/* NOW */}
      <section aria-labelledby="now-heading" className="space-y-2">
        <h2
          id="now-heading"
          className="text-xs font-bold uppercase tracking-widest text-slate-400"
        >
          Now
        </h2>
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-slate-900 p-3 text-white">
              <ClipboardList className="h-6 w-6" aria-hidden />
            </span>
            <div className="flex-1">
              <p className="text-xl font-semibold leading-tight">{now.task}</p>
              <p className="text-sm text-slate-500">{now.subtitle}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Progress</span>
              <span className="font-medium text-slate-700">
                {now.done}/{now.total}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${(now.done / now.total) * 100}%` }}
              />
            </div>
          </div>

          <BigButton block className="mt-5">
            Open checklist
          </BigButton>
        </div>
      </section>

      {/* NEXT */}
      <section aria-labelledby="next-heading" className="space-y-2">
        <h2
          id="next-heading"
          className="text-xs font-bold uppercase tracking-widest text-slate-400"
        >
          Next
        </h2>
        <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div>
            <p className="font-semibold">{next.task}</p>
            <p className="text-sm text-slate-500">{next.time}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-300" aria-hidden />
        </div>
      </section>

      {/* Recent alerts */}
      <section aria-labelledby="alerts-heading" className="space-y-2">
        <h2
          id="alerts-heading"
          className="text-xs font-bold uppercase tracking-widest text-slate-400"
        >
          Recent alerts
        </h2>
        <ul className="space-y-2">
          {alerts.map(({ id, Icon, tone, text, time }) => (
            <li
              key={id}
              className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
            >
              <span
                className={`mt-0.5 rounded-xl p-2 ring-1 ring-inset ${toneStyles[tone]}`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="flex-1">
                <p className="text-sm leading-snug text-slate-800">{text}</p>
                <p className="mt-1 text-xs text-slate-400">{time}</p>
              </div>
            </li>
          ))}
          {alerts.length === 0 && (
            <li className="rounded-2xl bg-white p-4 text-sm text-slate-400 ring-1 ring-slate-200">
              No alerts. You&apos;re all clear.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
