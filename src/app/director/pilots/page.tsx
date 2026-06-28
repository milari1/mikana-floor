import { PILOTS, type PilotDay } from '@/lib/pilots';
import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<PilotDay['status'], string> = {
  on_track: 'bg-emerald-100 text-emerald-700',
  watch: 'bg-amber-100 text-amber-700',
  breach: 'bg-red-100 text-red-700',
};

export default function PilotsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Pilot agents</h1>
      <p className="text-sm text-slate-500">
        Agents surface signals; the director decides whether to continue or kill.
      </p>

      <div className="space-y-4">
        {PILOTS.map((pilot) => (
          <section
            key={pilot.key}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">{pilot.name}</h2>
              <span className="text-xs text-slate-400">{pilot.kpiLabel}</span>
            </div>
            <p className="mt-1 text-sm text-red-600">
              Kill criteria: {pilot.killCriteria}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {pilot.days.map((d) => (
                <div
                  key={d.day}
                  className={cn(
                    'flex w-24 flex-col items-center rounded-xl px-3 py-2',
                    STATUS_STYLE[d.status],
                  )}
                >
                  <span className="text-xs font-medium">Day {d.day}</span>
                  <span className="text-xl font-bold">{d.kpi}</span>
                  <span className="text-[10px] uppercase tracking-wide">
                    {d.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
