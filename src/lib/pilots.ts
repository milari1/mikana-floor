/**
 * Pilot agent configuration. Hardcoded for now; later sourced from config/db.
 * Each pilot runs day-by-day with KPIs measured against kill criteria. The
 * agent surfaces signals — humans decide whether to continue or kill.
 */
export type PilotDay = {
  day: number;
  kpi: number;
  status: 'on_track' | 'watch' | 'breach';
};

export type Pilot = {
  key: string;
  name: string;
  kpiLabel: string;
  killCriteria: string;
  days: PilotDay[];
};

export const PILOTS: Pilot[] = [
  {
    key: 'food_safety',
    name: 'Food safety agent',
    kpiLabel: 'CCP logs on time (%)',
    killCriteria: 'Below 95% for 3 consecutive days',
    days: [
      { day: 1, kpi: 98, status: 'on_track' },
      { day: 2, kpi: 97, status: 'on_track' },
      { day: 3, kpi: 94, status: 'watch' },
      { day: 4, kpi: 96, status: 'on_track' },
    ],
  },
  {
    key: 'kaizen',
    name: 'Kaizen agent',
    kpiLabel: 'Ideas surfaced per shift',
    killCriteria: 'Zero ideas surfaced for 5 consecutive days',
    days: [
      { day: 1, kpi: 3, status: 'on_track' },
      { day: 2, kpi: 2, status: 'on_track' },
      { day: 3, kpi: 0, status: 'watch' },
      { day: 4, kpi: 1, status: 'on_track' },
    ],
  },
  {
    key: 'scheduling',
    name: 'Scheduling agent',
    kpiLabel: 'Labor vs plan variance (%)',
    killCriteria: 'Variance over 10% for 3 consecutive days',
    days: [
      { day: 1, kpi: 4, status: 'on_track' },
      { day: 2, kpi: 6, status: 'on_track' },
      { day: 3, kpi: 12, status: 'breach' },
      { day: 4, kpi: 8, status: 'watch' },
    ],
  },
];
