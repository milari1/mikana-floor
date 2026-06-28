import type { ReactNode } from 'react';

import { CrewActionBar } from '@/components/crew/CrewActionBar';
import { CrewOfflineSync } from '@/components/crew/CrewOfflineSync';

/**
 * Crew surface chrome: full-height phone layout (no max-width) with a
 * persistent bottom action bar. The bar hides itself on shift-on/shift-off.
 */
export default function CrewLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
      <CrewOfflineSync />
      {children}
      <CrewActionBar />
    </div>
  );
}
