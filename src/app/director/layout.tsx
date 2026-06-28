import Link from 'next/link';
import type { ReactNode } from 'react';

const NAV = [
  { href: '/director', label: 'Dashboard' },
  { href: '/director/doctrine', label: 'Doctrine' },
  { href: '/director/pilots', label: 'Pilots' },
];

export default function DirectorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
          <span className="text-lg font-bold tracking-tight">
            Mikana Floor <span className="text-slate-400">· Director</span>
          </span>
          <nav className="flex gap-1">
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
      <main className="mx-auto max-w-6xl px-8 py-8">{children}</main>
    </div>
  );
}
