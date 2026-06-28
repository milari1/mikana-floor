/**
 * Role hierarchy for Mikana Floor.
 *
 * Floor/management roles are ranked. `auditor` is intentionally outside the
 * ladder: it is a read-only role gated by an exact match, not by rank.
 */
export const ROLES = [
  'crew',
  'receiver',
  'mod',
  'gm',
  'director',
  'exec',
  'auditor',
] as const;

export type Role = (typeof ROLES)[number];

/** Ranked seniority. `auditor` sits at 0 (handled by exact match, not rank). */
export const ROLE_RANK: Record<Role, number> = {
  auditor: 0,
  crew: 1,
  receiver: 2,
  mod: 3,
  gm: 4,
  director: 5,
  exec: 6,
};

/** True when `role` is at least as senior as `min` (rank-based). */
export function atLeast(role: Role, min: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

/** Roles that authenticate via email magic link (GM and above + auditor). */
export const MAGIC_LINK_ROLES: ReadonlySet<Role> = new Set<Role>([
  'gm',
  'director',
  'exec',
  'auditor',
]);
