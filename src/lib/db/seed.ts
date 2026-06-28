import './load-env';

import bcrypt from 'bcryptjs';

import { db } from './index';
import { sites, users, standards } from './schema';

/**
 * Seeds a fresh database with baseline data:
 *   - 2 sites
 *   - one user per role (except auditor)
 *   - 3 standards
 *
 * Idempotency is NOT guaranteed — run against an empty/migrated database.
 */
async function main() {
  const now = new Date();
  const passwordHash = bcrypt.hashSync('mikana-dev-password', 10);
  const hashPin = (pin: string) => bcrypt.hashSync(pin, 10);

  /* ---------------------------------------------------------------- sites */
  const siteIds = {
    catering: crypto.randomUUID(),
    distribution: crypto.randomUUID(),
  };

  await db.insert(sites).values([
    {
      id: siteIds.catering,
      name: 'Mikana Catering — Central Kitchen',
      segment: 'catering',
      timezone: 'America/New_York',
    },
    {
      id: siteIds.distribution,
      name: 'Mikana Distribution — Warehouse 1',
      segment: 'distribution',
      timezone: 'America/Chicago',
    },
  ]);

  /* ---------------------------------------------------------------- users */
  // One per role except auditor. The role enum has 7 values; excluding
  // `auditor` leaves 6 (the build prompt's "5" undercounts the enum).
  // Floor roles (crew/receiver/mod) sign in with a site + 4-digit PIN.
  // GM and above (gm/director/exec) sign in with an email magic link.
  const seedUsers = [
    { role: 'crew' as const, name: 'Casey Crew', siteId: siteIds.catering, pin: '1234' },
    { role: 'receiver' as const, name: 'Riley Receiver', siteId: siteIds.distribution, pin: '2345' },
    { role: 'mod' as const, name: 'Morgan Manager-on-Duty', siteId: siteIds.catering, pin: '3456' },
    { role: 'gm' as const, name: 'Gabi GM', siteId: siteIds.catering, pin: null },
    { role: 'director' as const, name: 'Dana Director', siteId: null, pin: null },
    { role: 'exec' as const, name: 'Eli Exec', siteId: null, pin: null },
  ];

  const userIds: Record<string, string> = {};
  await db.insert(users).values(
    seedUsers.map((u) => {
      const id = crypto.randomUUID();
      userIds[u.role] = id;
      return {
        id,
        email: `${u.role}@mikana.test`,
        name: u.name,
        role: u.role,
        passwordHash,
        pinHash: u.pin ? hashPin(u.pin) : null,
        siteId: u.siteId,
        active: true,
      };
    }),
  );

  /* ------------------------------------------------------------ standards */
  await db.insert(standards).values([
    {
      station: 'Receiving Dock',
      phase: 'opening',
      title: 'Receiving Dock — Opening',
      version: 1,
      bodyMd: '# Receiving Dock SOP',
      stepsJson: [
        {
          name: 'Verify delivery temperature',
          detail_md: 'Probe each cold load on arrival. Reject above 41°F.',
        },
        {
          name: 'Inspect packaging',
          detail_md: 'Check for damage, leaks, and pest signs.',
        },
        {
          name: 'Log and photograph rejections',
          detail_md: 'Record any rejected items with a photo.',
        },
      ],
      effectiveAt: now,
      authorId: userIds.gm,
      approvedBy: userIds.director,
    },
    {
      station: 'Cold Prep',
      phase: 'prep',
      title: 'Cold Prep — Prep',
      version: 1,
      bodyMd: '# Cold Prep SOP',
      stepsJson: [
        {
          name: 'Sanitize surfaces',
          detail_md: 'Sanitize all surfaces and tools before starting.',
        },
        { name: 'Hold product below 41°F', detail_md: 'Keep product cold.' },
        {
          name: 'Label prep time and use-by',
          detail_md: 'Every container gets a prep time and use-by label.',
        },
      ],
      effectiveAt: now,
      authorId: userIds.gm,
      approvedBy: userIds.director,
    },
    {
      station: 'Final Plating',
      phase: 'service',
      title: 'Final Plating — Service',
      version: 1,
      bodyMd: '# Final Plating SOP',
      stepsJson: [
        {
          name: 'Confirm allergen separation',
          detail_md: 'Verify allergen-free items stayed separated.',
        },
        {
          name: 'Check portion vs spec card',
          detail_md: 'Compare portion to the active spec card.',
        },
        {
          name: 'Wipe rims, hold at temperature',
          detail_md: 'Clean plate rims; hold at service temperature.',
        },
      ],
      effectiveAt: now,
      authorId: userIds.gm,
      approvedBy: userIds.director,
    },
  ]);

  console.log('Seed complete:');
  console.log(`  sites:     ${Object.keys(siteIds).length}`);
  console.log(`  users:     ${seedUsers.length}`);
  console.log(`  standards: 3`);
  console.log('\nDev crew PINs (site + pin):');
  console.log(`  Casey Crew     @ Catering     pin 1234`);
  console.log(`  Riley Receiver @ Distribution pin 2345`);
  console.log(`  Morgan MoD     @ Catering     pin 3456`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
