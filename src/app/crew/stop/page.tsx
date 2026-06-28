import {
  ClipboardCheck,
  MoreHorizontal,
  Thermometer,
  Truck,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import { STOP_CATEGORIES } from '@/lib/stop-taxonomy';

const ICONS: Record<string, LucideIcon> = {
  food_safety: Thermometer,
  quality: ClipboardCheck,
  equipment: Wrench,
  supplier: Truck,
  other: MoreHorizontal,
};

export default function StopCategoryPage() {
  return (
    <main className="flex flex-1 flex-col px-5 pt-6">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stop the line</h1>
          <p className="text-sm text-slate-500">
            Catching it early is the job. What needs to stop?
          </p>
        </div>
        <Link
          href="/crew"
          aria-label="Cancel"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:bg-slate-200"
        >
          <X className="h-5 w-5" aria-hidden />
        </Link>
      </header>

      <div className="grid gap-3">
        {STOP_CATEGORIES.map(({ key, label }) => {
          const Icon = ICONS[key];
          return (
            <Link
              key={key}
              href={`/crew/stop/${key}`}
              className="flex min-h-[72px] items-center gap-4 rounded-2xl bg-white px-5 py-4 text-left shadow-sm ring-1 ring-slate-200 transition active:scale-[0.99] active:bg-slate-50"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <span className="text-lg font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
