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
      version: 1,
      bodyMd:
        '# Receiving Dock SOP\n\n1. Verify temperature on arrival.\n2. Inspect packaging for damage.\n3. Photograph and log any rejections.',
      effectiveAt: now,
      authorId: userIds.gm,
      approvedBy: userIds.director,
    },
    {
      station: 'Cold Prep',
      version: 1,
      bodyMd:
        '# Cold Prep SOP\n\n1. Sanitize surfaces before start.\n2. Keep product below 41°F.\n3. Label with prep time and use-by.',
      effectiveAt: now,
      authorId: userIds.gm,
      approvedBy: userIds.director,
    },
    {
      station: 'Final Plating',
      version: 1,
      bodyMd:
        '# Final Plating SOP\n\n1. Confirm allergen separation.\n2. Check portion against spec card.\n3. Wipe rims; hold at temperature.',
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
