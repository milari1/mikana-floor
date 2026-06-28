import { and, eq, gte } from 'drizzle-orm';
import Link from 'next/link';

import { db } from '@/lib/db';
import { qualityEvents, sites, stops } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const SEGMENTS = ['catering', 'restaurant', 'institutional', 'distribution'];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function DirectorDashboardPage({
  searchParams,
}: {
  searchParams: { segment?: string };
}) {
  const segment = searchParams.segment;
  const since = startOfToday();

  const allSites = await db.select().from(sites);
  const filtered = segment
    ? allSites.filter((s) => s.segment === segment)
    : allSites;

  const rows = await Promise.all(
    filtered.map(async (site) => {
      const [openStops, qualityToday] = await Promise.all([
        db
          .select({ id: stops.id })
          .from(stops)
          .where(and(eq(stops.siteId, site.id), eq(stops.resolved, false))),
        db
          .select({ id: qualityEvents.id })
          .from(qualityEvents)
          .where(
            and(
              eq(qualityEvents.siteId, site.id),
              gte(qualityEvents.createdAt, since),
            ),
          ),
      ]);
      return {
        site,
        openStops: openStops.length,
        qualityToday: qualityToday.length,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Cross-site overview</h1>

      {/* Segment filter */}
      <div className="flex flex-wrap gap-2">
        <SegmentChip label="All" href="/director" active={!segment} />
        {SEGMENTS.map((s) => (
          <SegmentChip
            key={s}
            label={s}
            href={`/director?segment=${s}`}
            active={segment === s}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Site</th>
              <th className="px-4 py-3">Segment</th>
              <th className="px-4 py-3">Open stops</th>
              <th className="px-4 py-3">Quality flags (today)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ site, openStops, qualityToday }) => (
              <tr key={site.id}>
                <td className="px-4 py-3 font-medium">{site.name}</td>
                <td className="px-4 py-3 capitalize text-slate-500">
                  {site.segment}
                </td>
                <td className="px-4 py-3">{openStops}</td>
                <td className="px-4 py-3">{qualityToday}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={4}>
                  No sites for this segment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SegmentChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'rounded-full px-4 py-1.5 text-sm font-medium capitalize',
        active
          ? 'bg-slate-900 text-white'
          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
      )}
    >
      {label}
    </Link>
  );
}
