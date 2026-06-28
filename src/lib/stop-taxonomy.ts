import { z } from 'zod';

/**
 * Stop categories (match the `stop_category` enum) and their subcategories.
 * Shared by the crew UI and the API validation so they never drift.
 */
export const STOP_CATEGORIES = [
  { key: 'food_safety', label: 'Food safety' },
  { key: 'quality', label: 'Quality' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'other', label: 'Other' },
] as const;

export type StopCategory = (typeof STOP_CATEGORIES)[number]['key'];

export const STOP_CATEGORY_KEYS = STOP_CATEGORIES.map((c) => c.key) as [
  StopCategory,
  ...StopCategory[],
];

type SubOption = { key: string; label: string };

export const STOP_SUBCATEGORIES: Record<StopCategory, SubOption[]> = {
  food_safety: [
    { key: 'temperature_breach', label: 'Temperature breach' },
    { key: 'time_in_zone', label: 'Time in zone' },
    { key: 'contamination', label: 'Contamination' },
    { key: 'haccp_skipped', label: 'HACCP step skipped' },
    { key: 'allergen', label: 'Allergen' },
    { key: 'other', label: 'Other' },
  ],
  quality: [
    { key: 'portion', label: 'Portion' },
    { key: 'plate', label: 'Plate' },
    { key: 'temperature', label: 'Temperature' },
    { key: 'texture', label: 'Texture' },
    { key: 'recipe', label: 'Recipe' },
    { key: 'other', label: 'Other' },
  ],
  equipment: [
    { key: 'not_working', label: 'Not working' },
    { key: 'calibration', label: 'Calibration' },
    { key: 'parts_needed', label: 'Parts needed' },
    { key: 'other', label: 'Other' },
  ],
  supplier: [
    { key: 'ingredient_quality', label: 'Ingredient quality' },
    { key: 'missing', label: 'Missing' },
    { key: 'contamination', label: 'Contamination' },
    { key: 'other', label: 'Other' },
  ],
  // "Other" has no subcategories: a single confirm completes the stop.
  other: [],
};

export function isStopCategory(value: string): value is StopCategory {
  return STOP_CATEGORY_KEYS.includes(value as StopCategory);
}

export function categoryLabel(key: StopCategory): string {
  return STOP_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

/** Payload accepted by POST /api/stops and the offline queue. */
export const stopPayloadSchema = z.object({
  category: z.enum(STOP_CATEGORY_KEYS),
  subcategory: z.string().nullish(),
  station: z.string().nullish(),
  shiftId: z.string().nullish(),
  detail: z.string().nullish(),
  // ISO timestamp captured client-side so queued offline stops keep their time
  openedAt: z.string().nullish(),
});

export type StopPayload = z.infer<typeof stopPayloadSchema>;
