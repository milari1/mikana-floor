'use client';

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Circle,
  Image as ImageIcon,
  SkipForward,
} from 'lucide-react';
import { useRef, useState } from 'react';

import type { CompletionStatus, StandardStep } from '@/lib/checklist';
import { cn } from '@/lib/utils';

const LONG_PRESS_MS = 500;

const STATUS_ICON: Record<CompletionStatus | 'pending', typeof Circle> = {
  pending: Circle,
  done: CheckCircle2,
  skipped: SkipForward,
  cant_complete_equipment: AlertCircle,
  cant_complete_ingredient: AlertCircle,
  needs_help: AlertCircle,
};

const STATUS_COLOR: Record<CompletionStatus | 'pending', string> = {
  pending: 'text-slate-300',
  done: 'text-emerald-600',
  skipped: 'text-slate-400',
  cant_complete_equipment: 'text-amber-600',
  cant_complete_ingredient: 'text-amber-600',
  needs_help: 'text-red-600',
};

const MENU_OPTIONS: { status: CompletionStatus; label: string; reason?: boolean }[] = [
  { status: 'skipped', label: 'Skip (give a reason)', reason: true },
  { status: 'cant_complete_equipment', label: "Can't complete — equipment" },
  { status: 'cant_complete_ingredient', label: "Can't complete — ingredient" },
  { status: 'needs_help', label: 'Needs help (notify MOD)' },
];

export function ChecklistStep({
  step,
  index,
  status,
  busy,
  onComplete,
  onViewPhoto,
}: {
  step: StandardStep;
  index: number;
  status: CompletionStatus | 'pending';
  busy: boolean;
  onComplete: (status: CompletionStatus, reason?: string) => void;
  onViewPhoto: (src: string, alt: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const Icon = STATUS_ICON[status];
  const settled = status !== 'pending';

  const startPress = () => {
    timer.current = setTimeout(() => setMenuOpen(true), LONG_PRESS_MS);
  };
  const cancelPress = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const pick = (s: CompletionStatus, reason?: boolean) => {
    setMenuOpen(false);
    let note: string | undefined;
    if (reason && typeof window !== 'undefined') {
      note = window.prompt('Reason for skipping this step?') ?? undefined;
    }
    onComplete(s, note);
  };

  return (
    <li
      className={cn(
        'rounded-2xl bg-white shadow-sm ring-1 ring-slate-200',
        settled && 'opacity-80',
      )}
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
    >
      <div className="flex items-center gap-3 p-4">
        <Icon className={cn('h-7 w-7 shrink-0', STATUS_COLOR[status])} aria-hidden />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center justify-between text-left"
          aria-expanded={expanded}
        >
          <span className="text-base font-semibold">
            {index + 1}. {step.name}
          </span>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-slate-400 transition',
              expanded && 'rotate-180',
            )}
            aria-hidden
          />
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 px-4 pb-4">
          {step.detail_md && (
            <p className="whitespace-pre-wrap text-sm text-slate-600">
              {step.detail_md}
            </p>
          )}
          {step.photo_url && (
            <button
              type="button"
              onClick={() => onViewPhoto(step.photo_url!, step.name)}
              className="inline-flex items-center gap-2 text-sm font-medium text-sky-600"
            >
              <ImageIcon className="h-4 w-4" aria-hidden />
              View spec photo
            </button>
          )}
        </div>
      )}

      {!settled && (
        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => onComplete('done')}
            className="flex min-h-[56px] w-full items-center justify-center rounded-xl bg-emerald-600 text-lg font-semibold text-white active:bg-emerald-700 disabled:opacity-50"
          >
            Done
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">
            Press and hold for other options
          </p>
        </div>
      )}

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40"
          role="dialog"
          aria-modal="true"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-full space-y-2 rounded-t-3xl bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-2 pb-1 text-sm font-semibold text-slate-500">
              {step.name}
            </p>
            {MENU_OPTIONS.map((opt) => (
              <button
                key={opt.status}
                type="button"
                onClick={() => pick(opt.status, opt.reason)}
                className="flex min-h-[56px] w-full items-center rounded-xl bg-slate-50 px-4 text-left text-base font-medium active:bg-slate-100"
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-[56px] w-full items-center justify-center rounded-xl text-base font-medium text-slate-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
