import Link from 'next/link';
import type { ReactNode } from 'react';

import { PushSubscribe } from '@/components/gm/PushSubscribe';

const NAV = [
  { href: '/gm', label: 'Dashboard' },
  { href: '/gm/stops', label: 'Stops' },
  { href: '/gm/huddle', label: 'Huddle' },
  { href: '/gm/schedule', label: 'Schedule' },
  { href: '/gm/standards', label: 'Standards' },
];

export default function GmLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900">
      <PushSubscribe />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight">
            Mikana Floor <span className="text-slate-400">· GM</span>
          </span>
          <nav className="flex flex-wrap gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-6">{children}</main>
    </div>
  );
}
