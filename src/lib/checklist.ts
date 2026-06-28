import { z } from 'zod';

export type StandardStep = {
  name: string;
  detail_md?: string;
  photo_url?: string;
};

/** Shape cached client-side and returned by the standards API. */
export type ChecklistStandard = {
  id: string;
  station: string;
  phase: string | null;
  title: string | null;
  version: number;
  bodyMd: string | null;
  photoUrl: string | null;
  steps: StandardStep[];
};

export const COMPLETION_STATUSES = [
  'done',
  'skipped',
  'cant_complete_equipment',
  'cant_complete_ingredient',
  'needs_help',
] as const;

export type CompletionStatus = (typeof COMPLETION_STATUSES)[number];

export const completionPayloadSchema = z.object({
  standardId: z.string(),
  standardVersion: z.number().int(),
  stepIndex: z.number().int().nullish(),
  stepName: z.string().nullish(),
  status: z.enum(COMPLETION_STATUSES).default('done'),
  reason: z.string().nullish(),
  completedAt: z.string().nullish(),
});

export type CompletionPayload = z.infer<typeof completionPayloadSchema>;
