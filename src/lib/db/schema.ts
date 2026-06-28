import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

/* -------------------------------------------------------------------------- */
/*  Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const userRoleEnum = pgEnum('user_role', [
  'crew',
  'receiver',
  'mod',
  'gm',
  'director',
  'exec',
  'auditor',
]);

export const stopCategoryEnum = pgEnum('stop_category', [
  'food_safety',
  'quality',
  'equipment',
  'supplier',
  'other',
]);

export const shiftStatusEnum = pgEnum('shift_status', [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
]);

/* -------------------------------------------------------------------------- */
/*  Column helpers                                                             */
/* -------------------------------------------------------------------------- */

/** uuid primary key, generated app-side via crypto.randomUUID(). */
const pk = () => uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID());

/** created_at timestamptz, defaults to now(). */
const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).defaultNow().notNull();

/** jsonb column defaulting to an empty object. */
const emptyJsonObject = sql`'{}'::jsonb`;

/* -------------------------------------------------------------------------- */
/*  sites                                                                      */
/* -------------------------------------------------------------------------- */

export const sites = pgTable('sites', {
  id: pk(),
  name: text('name').notNull(),
  // catering | restaurant | institutional | distribution
  segment: text('segment').notNull(),
  timezone: text('timezone').notNull().default('UTC'),
  createdAt: createdAt(),
});

/* -------------------------------------------------------------------------- */
/*  users                                                                      */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  'users',
  {
    id: pk(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    role: userRoleEnum('role').notNull(),
    passwordHash: text('password_hash'),
    // bcrypt hash of a 4-digit PIN for shared-device (crew) sign-in
    pinHash: text('pin_hash'),
    siteId: uuid('site_id').references(() => sites.id),
    active: boolean('active').notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('users_email_idx').on(t.email),
    index('users_site_idx').on(t.siteId),
    index('users_role_idx').on(t.role),
  ],
);

/* -------------------------------------------------------------------------- */
/*  shifts                                                                     */
/* -------------------------------------------------------------------------- */

export const shifts = pgTable(
  'shifts',
  {
    id: pk(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id),
    status: shiftStatusEnum('status').notNull().default('scheduled'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    gmId: uuid('gm_id').references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [
    index('shifts_site_idx').on(t.siteId),
    index('shifts_gm_idx').on(t.gmId),
    index('shifts_status_idx').on(t.status),
  ],
);

/* -------------------------------------------------------------------------- */
/*  suppliers                                                                  */
/* -------------------------------------------------------------------------- */

export const suppliers = pgTable('suppliers', {
  id: pk(),
  name: text('name').notNull(),
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  phone: text('phone'),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt(),
});

/* -------------------------------------------------------------------------- */
/*  standards (versioned)                                                      */
/* -------------------------------------------------------------------------- */

export const standards = pgTable(
  'standards',
  {
    id: pk(),
    station: text('station').notNull(),
    version: integer('version').notNull().default(1),
    bodyMd: text('body_md').notNull(),
    photoUrl: text('photo_url'),
    effectiveAt: timestamp('effective_at', { withTimezone: true }),
    // self-reference: the standard this version supersedes
    supersedesId: uuid('supersedes_id').references(
      (): AnyPgColumn => standards.id,
    ),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
    approvedBy: uuid('approved_by').references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [
    index('standards_station_idx').on(t.station),
    index('standards_supersedes_idx').on(t.supersedesId),
    index('standards_author_idx').on(t.authorId),
    index('standards_approved_by_idx').on(t.approvedBy),
    uniqueIndex('standards_station_version_idx').on(t.station, t.version),
  ],
);

/* -------------------------------------------------------------------------- */
/*  standard_completions                                                       */
/* -------------------------------------------------------------------------- */

export const standardCompletions = pgTable(
  'standard_completions',
  {
    id: pk(),
    standardId: uuid('standard_id')
      .notNull()
      .references(() => standards.id),
    // the version of the standard the user actually saw
    standardVersion: integer('standard_version').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    shiftId: uuid('shift_id').references(() => shifts.id),
    siteId: uuid('site_id').references(() => sites.id),
    completedAt: timestamp('completed_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index('standard_completions_standard_idx').on(t.standardId),
    index('standard_completions_user_idx').on(t.userId),
    index('standard_completions_shift_idx').on(t.shiftId),
    index('standard_completions_site_idx').on(t.siteId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  stops (andon)                                                              */
/* -------------------------------------------------------------------------- */

export const stops = pgTable(
  'stops',
  {
    id: pk(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id),
    shiftId: uuid('shift_id').references(() => shifts.id),
    category: stopCategoryEnum('category').notNull(),
    description: text('description').notNull(),
    raisedBy: uuid('raised_by')
      .notNull()
      .references(() => users.id),
    resolved: boolean('resolved').notNull().default(false),
    resolvedBy: uuid('resolved_by').references(() => users.id),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index('stops_site_idx').on(t.siteId),
    index('stops_shift_idx').on(t.shiftId),
    index('stops_category_idx').on(t.category),
    index('stops_raised_by_idx').on(t.raisedBy),
    index('stops_resolved_by_idx').on(t.resolvedBy),
  ],
);

/* -------------------------------------------------------------------------- */
/*  kaizen_items                                                               */
/* -------------------------------------------------------------------------- */

export const kaizenItems = pgTable(
  'kaizen_items',
  {
    id: pk(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id),
    stopId: uuid('stop_id').references(() => stops.id),
    title: text('title').notNull(),
    description: text('description'),
    // open | in_progress | done | dropped
    status: text('status').notNull().default('open'),
    proposedBy: uuid('proposed_by')
      .notNull()
      .references(() => users.id),
    assignedTo: uuid('assigned_to').references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [
    index('kaizen_items_site_idx').on(t.siteId),
    index('kaizen_items_stop_idx').on(t.stopId),
    index('kaizen_items_proposed_by_idx').on(t.proposedBy),
    index('kaizen_items_assigned_to_idx').on(t.assignedTo),
  ],
);

/* -------------------------------------------------------------------------- */
/*  experiments (PDCA)                                                         */
/* -------------------------------------------------------------------------- */

export const experiments = pgTable(
  'experiments',
  {
    id: pk(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id),
    kaizenItemId: uuid('kaizen_item_id').references(() => kaizenItems.id),
    hypothesis: text('hypothesis').notNull(),
    // planned | running | completed | abandoned
    status: text('status').notNull().default('planned'),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    result: text('result'),
    createdAt: createdAt(),
  },
  (t) => [
    index('experiments_site_idx').on(t.siteId),
    index('experiments_kaizen_item_idx').on(t.kaizenItemId),
    index('experiments_owner_idx').on(t.ownerId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  quality_events                                                             */
/* -------------------------------------------------------------------------- */

export const qualityEvents = pgTable(
  'quality_events',
  {
    id: pk(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id),
    shiftId: uuid('shift_id').references(() => shifts.id),
    reportedBy: uuid('reported_by')
      .notNull()
      .references(() => users.id),
    payloadJson: jsonb('payload_json').notNull().default(emptyJsonObject),
    createdAt: createdAt(),
  },
  (t) => [
    index('quality_events_site_idx').on(t.siteId),
    index('quality_events_shift_idx').on(t.shiftId),
    index('quality_events_reported_by_idx').on(t.reportedBy),
  ],
);

/* -------------------------------------------------------------------------- */
/*  food_safety_events                                                         */
/* -------------------------------------------------------------------------- */

export const foodSafetyEvents = pgTable(
  'food_safety_events',
  {
    id: pk(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id),
    shiftId: uuid('shift_id').references(() => shifts.id),
    reportedBy: uuid('reported_by')
      .notNull()
      .references(() => users.id),
    payloadJson: jsonb('payload_json').notNull().default(emptyJsonObject),
    createdAt: createdAt(),
  },
  (t) => [
    index('food_safety_events_site_idx').on(t.siteId),
    index('food_safety_events_shift_idx').on(t.shiftId),
    index('food_safety_events_reported_by_idx').on(t.reportedBy),
  ],
);

/* -------------------------------------------------------------------------- */
/*  intake_events (receiving)                                                  */
/* -------------------------------------------------------------------------- */

export const intakeEvents = pgTable(
  'intake_events',
  {
    id: pk(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id),
    supplierId: uuid('supplier_id').references(() => suppliers.id),
    shiftId: uuid('shift_id').references(() => shifts.id),
    receivedBy: uuid('received_by')
      .notNull()
      .references(() => users.id),
    payloadJson: jsonb('payload_json').notNull().default(emptyJsonObject),
    createdAt: createdAt(),
  },
  (t) => [
    index('intake_events_site_idx').on(t.siteId),
    index('intake_events_supplier_idx').on(t.supplierId),
    index('intake_events_shift_idx').on(t.shiftId),
    index('intake_events_received_by_idx').on(t.receivedBy),
  ],
);

/* -------------------------------------------------------------------------- */
/*  huddles                                                                    */
/* -------------------------------------------------------------------------- */

export const huddles = pgTable(
  'huddles',
  {
    id: pk(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id),
    shiftId: uuid('shift_id').references(() => shifts.id),
    ledBy: uuid('led_by')
      .notNull()
      .references(() => users.id),
    attendeesJson: jsonb('attendees_json').notNull().default(sql`'[]'::jsonb`),
    scorecardSummaryJson: jsonb('scorecard_summary_json'),
    notes: text('notes'),
    heldAt: timestamp('held_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index('huddles_site_idx').on(t.siteId),
    index('huddles_shift_idx').on(t.shiftId),
    index('huddles_led_by_idx').on(t.ledBy),
  ],
);

/* -------------------------------------------------------------------------- */
/*  floor_walks (gemba)                                                        */
/* -------------------------------------------------------------------------- */

export const floorWalks = pgTable(
  'floor_walks',
  {
    id: pk(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id),
    walkerId: uuid('walker_id')
      .notNull()
      .references(() => users.id),
    notes: text('notes'),
    payloadJson: jsonb('payload_json').notNull().default(emptyJsonObject),
    startedAt: timestamp('started_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index('floor_walks_site_idx').on(t.siteId),
    index('floor_walks_walker_idx').on(t.walkerId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  doctrine_decisions (humans decide)                                         */
/* -------------------------------------------------------------------------- */

export const doctrineDecisions = pgTable(
  'doctrine_decisions',
  {
    id: pk(),
    siteId: uuid('site_id').references(() => sites.id),
    // which of the 14 management principles this decision invokes (1-14)
    principle: integer('principle'),
    title: text('title').notNull(),
    rationale: text('rationale'),
    decidedBy: uuid('decided_by')
      .notNull()
      .references(() => users.id),
    // optional pointer to the entity that triggered the decision
    relatedEntity: text('related_entity'),
    relatedId: uuid('related_id'),
    payloadJson: jsonb('payload_json').notNull().default(emptyJsonObject),
    createdAt: createdAt(),
  },
  (t) => [
    index('doctrine_decisions_site_idx').on(t.siteId),
    index('doctrine_decisions_decided_by_idx').on(t.decidedBy),
    index('doctrine_decisions_principle_idx').on(t.principle),
  ],
);

/* -------------------------------------------------------------------------- */
/*  audit_log (append-only)                                                    */
/* -------------------------------------------------------------------------- */

export const auditLog = pgTable(
  'audit_log',
  {
    id: pk(),
    actorId: uuid('actor_id').references(() => users.id),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: uuid('entity_id'),
    payloadJson: jsonb('payload_json').notNull().default(emptyJsonObject),
    createdAt: createdAt(),
  },
  (t) => [
    index('audit_log_actor_idx').on(t.actorId),
    index('audit_log_entity_idx').on(t.entity, t.entityId),
    index('audit_log_created_at_idx').on(t.createdAt),
  ],
);

/* -------------------------------------------------------------------------- */
/*  verification_tokens (Auth.js magic-link tokens)                            */
/* -------------------------------------------------------------------------- */

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* -------------------------------------------------------------------------- */
/*  Inferred types                                                             */
/* -------------------------------------------------------------------------- */

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
export type Standard = typeof standards.$inferSelect;
export type NewStandard = typeof standards.$inferInsert;
export type StandardCompletion = typeof standardCompletions.$inferSelect;
export type NewStandardCompletion = typeof standardCompletions.$inferInsert;
export type Stop = typeof stops.$inferSelect;
export type NewStop = typeof stops.$inferInsert;
export type KaizenItem = typeof kaizenItems.$inferSelect;
export type NewKaizenItem = typeof kaizenItems.$inferInsert;
export type Experiment = typeof experiments.$inferSelect;
export type NewExperiment = typeof experiments.$inferInsert;
export type QualityEvent = typeof qualityEvents.$inferSelect;
export type NewQualityEvent = typeof qualityEvents.$inferInsert;
export type FoodSafetyEvent = typeof foodSafetyEvents.$inferSelect;
export type NewFoodSafetyEvent = typeof foodSafetyEvents.$inferInsert;
export type IntakeEvent = typeof intakeEvents.$inferSelect;
export type NewIntakeEvent = typeof intakeEvents.$inferInsert;
export type Huddle = typeof huddles.$inferSelect;
export type NewHuddle = typeof huddles.$inferInsert;
export type FloorWalk = typeof floorWalks.$inferSelect;
export type NewFloorWalk = typeof floorWalks.$inferInsert;
export type DoctrineDecision = typeof doctrineDecisions.$inferSelect;
export type NewDoctrineDecision = typeof doctrineDecisions.$inferInsert;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
