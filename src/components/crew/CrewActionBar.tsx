'use client';

import { Check, Mic, Octagon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

// Routes where the action bar is hidden (sign-on / sign-off flows).
const HIDDEN_ON = ['/crew/shift-on', '/crew/shift-off'];

const ACTIONS = [
  {
    href: '/crew/stop',
    label: 'STOP',
    Icon: Octagon,
    className: 'bg-red-600 active:bg-red-700',
  },
  {
    href: '/crew/kaizen',
    label: 'KAIZEN',
    Icon: Mic,
    className: 'bg-blue-600 active:bg-blue-700',
  },
  {
    href: '/crew/quality',
    label: 'QUALITY',
    Icon: Check,
    className: 'bg-emerald-600 active:bg-emerald-700',
  },
] as const;

export function CrewActionBar() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <>
      {/* Spacer so fixed bar never covers page content. */}
      <div aria-hidden className="h-[calc(4rem+env(safe-area-inset-bottom))]" />

      <nav
        aria-label="Crew quick actions"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 gap-px bg-slate-200 pb-[env(safe-area-inset-bottom)]"
      >
        {ACTIONS.map(({ href, label, Icon, className }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-white ' +
                'text-sm font-bold tracking-wide transition',
              className,
            )}
          >
            <Icon className="h-6 w-6" strokeWidth={2.5} aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
