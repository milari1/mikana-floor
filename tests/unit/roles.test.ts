import { describe, expect, it } from 'vitest';

import { atLeast, MAGIC_LINK_ROLES, ROLE_RANK } from '@/lib/roles';
import { isStopCategory } from '@/lib/stop-taxonomy';

describe('role hierarchy', () => {
  it('ranks seniority correctly', () => {
    expect(atLeast('gm', 'mod')).toBe(true);
    expect(atLeast('mod', 'gm')).toBe(false);
    expect(atLeast('crew', 'crew')).toBe(true);
  });

  it('keeps auditor outside the ladder', () => {
    expect(ROLE_RANK.auditor).toBe(0);
    expect(atLeast('auditor', 'crew')).toBe(false);
  });

  it('routes the right roles to magic-link auth', () => {
    expect(MAGIC_LINK_ROLES.has('gm')).toBe(true);
    expect(MAGIC_LINK_ROLES.has('crew')).toBe(false);
  });
});

describe('stop taxonomy', () => {
  it('validates known categories', () => {
    expect(isStopCategory('food_safety')).toBe(true);
    expect(isStopCategory('quality')).toBe(true);
    expect(isStopCategory('nonsense')).toBe(false);
  });
});
