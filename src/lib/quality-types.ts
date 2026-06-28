import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/*  Quality                                                                    */
/* -------------------------------------------------------------------------- */

export const QUALITY_CATEGORIES = [
  { key: 'portion', label: 'Portion' },
  { key: 'plate', label: 'Plate' },
  { key: 'temperature', label: 'Temperature' },
  { key: 'texture', label: 'Texture' },
  { key: 'other', label: 'Other' },
] as const;

export type QualityCategory = (typeof QUALITY_CATEGORIES)[number]['key'];

export const QUALITY_CATEGORY_KEYS = QUALITY_CATEGORIES.map((c) => c.key) as [
  QualityCategory,
  ...QualityCategory[],
];

// recalibrate / log / escalate — the app computes variance, the human decides.
export const QUALITY_ACTIONS = ['recalibrate', 'log', 'escalate'] as const;
export type QualityAction = (typeof QUALITY_ACTIONS)[number];

/**
 * Mock recipe specs. There is no recipes table in the data model yet; in
 * production these come from the recipe/spec service. `version` lets quality
 * events record the spec version the measurement was taken against.
 */
export const RECIPES = [
  { id: 'r-caesar', name: 'House Caesar', version: 3, unit: 'g', spec: 120 },
  { id: 'r-salmon', name: 'Grilled Salmon', version: 2, unit: 'g', spec: 170 },
  { id: 'r-fries', name: 'Side Fries', version: 1, unit: 'g', spec: 140 },
] as const;

export const qualityPayloadSchema = z.object({
  category: z.enum(QUALITY_CATEGORY_KEYS),
  recipeId: z.string().nullish(),
  recipeName: z.string().nullish(),
  recipeVersion: z.number().int().nullish(),
  spec: z.number().nullish(),
  actual: z.number().nullish(),
  variance: z.number().nullish(),
  action: z.enum(QUALITY_ACTIONS),
  detail: z.string().nullish(),
  createdAt: z.string().nullish(),
});

export type QualityPayload = z.infer<typeof qualityPayloadSchema>;

/* -------------------------------------------------------------------------- */
/*  Intake                                                                     */
/* -------------------------------------------------------------------------- */

export const INTAKE_REJECT_REASONS = [
  { key: 'temperature', label: 'Temperature' },
  { key: 'packaging', label: 'Packaging' },
  { key: 'count_short', label: 'Count short' },
  { key: 'quality', label: 'Quality' },
  { key: 'spec_dev', label: 'Spec deviation' },
] as const;

export const INTAKE_REJECT_REASON_KEYS = INTAKE_REJECT_REASONS.map(
  (r) => r.key,
) as [string, ...string[]];

export const intakePayloadSchema = z.object({
  supplierId: z.string(),
  supplierName: z.string().nullish(),
  line: z.string(),
  action: z.enum(['accept', 'reject']),
  reason: z.enum(INTAKE_REJECT_REASON_KEYS).nullish(),
  createdAt: z.string().nullish(),
});

export type IntakePayload = z.infer<typeof intakePayloadSchema>;

/**
 * Mock "today's expected deliveries". There is no PO/delivery table yet; in
 * production these come from the purchasing system. `supplierId` values must
 * exist in `suppliers` for the event insert to succeed (seed adds suppliers
 * separately, or null is allowed).
 */
export type ExpectedDelivery = {
  supplierId: string | null;
  supplierName: string;
  lines: string[];
};

export const EXPECTED_DELIVERIES: ExpectedDelivery[] = [
  {
    supplierId: null,
    supplierName: 'Coastal Produce',
    lines: ['Romaine — 4 cases', 'Tomatoes — 2 cases', 'Lemons — 1 case'],
  },
  {
    supplierId: null,
    supplierName: 'Harbor Seafood',
    lines: ['Salmon fillet — 20 lb', 'Shrimp 16/20 — 10 lb'],
  },
];
