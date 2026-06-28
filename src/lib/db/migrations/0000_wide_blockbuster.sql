CREATE TYPE "public"."shift_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."stop_category" AS ENUM('food_safety', 'quality', 'equipment', 'supplier', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('crew', 'receiver', 'mod', 'gm', 'director', 'exec', 'auditor');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" uuid,
	"payload_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctrine_decisions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"site_id" uuid,
	"principle" integer,
	"title" text NOT NULL,
	"rationale" text,
	"decided_by" uuid NOT NULL,
	"related_entity" text,
	"related_id" uuid,
	"payload_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"site_id" uuid NOT NULL,
	"kaizen_item_id" uuid,
	"hypothesis" text NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"owner_id" uuid NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"result" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "floor_walks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"site_id" uuid NOT NULL,
	"walker_id" uuid NOT NULL,
	"notes" text,
	"payload_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_safety_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"site_id" uuid NOT NULL,
	"shift_id" uuid,
	"reported_by" uuid NOT NULL,
	"payload_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "huddles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"site_id" uuid NOT NULL,
	"shift_id" uuid,
	"led_by" uuid NOT NULL,
	"attendees_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scorecard_summary_json" jsonb,
	"notes" text,
	"held_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intake_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"site_id" uuid NOT NULL,
	"supplier_id" uuid,
	"shift_id" uuid,
	"received_by" uuid NOT NULL,
	"payload_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kaizen_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"site_id" uuid NOT NULL,
	"stop_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"proposed_by" uuid NOT NULL,
	"assigned_to" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"site_id" uuid NOT NULL,
	"shift_id" uuid,
	"reported_by" uuid NOT NULL,
	"payload_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"site_id" uuid NOT NULL,
	"status" "shift_status" DEFAULT 'scheduled' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"gm_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"segment" text NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "standard_completions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"standard_id" uuid NOT NULL,
	"standard_version" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"shift_id" uuid,
	"site_id" uuid,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "standards" (
	"id" uuid PRIMARY KEY NOT NULL,
	"station" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"body_md" text NOT NULL,
	"photo_url" text,
	"effective_at" timestamp with time zone,
	"supersedes_id" uuid,
	"author_id" uuid NOT NULL,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stops" (
	"id" uuid PRIMARY KEY NOT NULL,
	"site_id" uuid NOT NULL,
	"shift_id" uuid,
	"category" "stop_category" NOT NULL,
	"description" text NOT NULL,
	"raised_by" uuid NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact_name" text,
	"contact_email" text,
	"phone" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" NOT NULL,
	"password_hash" text,
	"site_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctrine_decisions" ADD CONSTRAINT "doctrine_decisions_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctrine_decisions" ADD CONSTRAINT "doctrine_decisions_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_kaizen_item_id_kaizen_items_id_fk" FOREIGN KEY ("kaizen_item_id") REFERENCES "public"."kaizen_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floor_walks" ADD CONSTRAINT "floor_walks_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floor_walks" ADD CONSTRAINT "floor_walks_walker_id_users_id_fk" FOREIGN KEY ("walker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_safety_events" ADD CONSTRAINT "food_safety_events_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_safety_events" ADD CONSTRAINT "food_safety_events_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_safety_events" ADD CONSTRAINT "food_safety_events_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "huddles" ADD CONSTRAINT "huddles_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "huddles" ADD CONSTRAINT "huddles_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "huddles" ADD CONSTRAINT "huddles_led_by_users_id_fk" FOREIGN KEY ("led_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_events" ADD CONSTRAINT "intake_events_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_events" ADD CONSTRAINT "intake_events_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_events" ADD CONSTRAINT "intake_events_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_events" ADD CONSTRAINT "intake_events_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kaizen_items" ADD CONSTRAINT "kaizen_items_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kaizen_items" ADD CONSTRAINT "kaizen_items_stop_id_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kaizen_items" ADD CONSTRAINT "kaizen_items_proposed_by_users_id_fk" FOREIGN KEY ("proposed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kaizen_items" ADD CONSTRAINT "kaizen_items_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_events" ADD CONSTRAINT "quality_events_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_events" ADD CONSTRAINT "quality_events_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_events" ADD CONSTRAINT "quality_events_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_gm_id_users_id_fk" FOREIGN KEY ("gm_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standard_completions" ADD CONSTRAINT "standard_completions_standard_id_standards_id_fk" FOREIGN KEY ("standard_id") REFERENCES "public"."standards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standard_completions" ADD CONSTRAINT "standard_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standard_completions" ADD CONSTRAINT "standard_completions_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standard_completions" ADD CONSTRAINT "standard_completions_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standards" ADD CONSTRAINT "standards_supersedes_id_standards_id_fk" FOREIGN KEY ("supersedes_id") REFERENCES "public"."standards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standards" ADD CONSTRAINT "standards_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standards" ADD CONSTRAINT "standards_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stops" ADD CONSTRAINT "stops_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stops" ADD CONSTRAINT "stops_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stops" ADD CONSTRAINT "stops_raised_by_users_id_fk" FOREIGN KEY ("raised_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stops" ADD CONSTRAINT "stops_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "doctrine_decisions_site_idx" ON "doctrine_decisions" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "doctrine_decisions_decided_by_idx" ON "doctrine_decisions" USING btree ("decided_by");--> statement-breakpoint
CREATE INDEX "doctrine_decisions_principle_idx" ON "doctrine_decisions" USING btree ("principle");--> statement-breakpoint
CREATE INDEX "experiments_site_idx" ON "experiments" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "experiments_kaizen_item_idx" ON "experiments" USING btree ("kaizen_item_id");--> statement-breakpoint
CREATE INDEX "experiments_owner_idx" ON "experiments" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "floor_walks_site_idx" ON "floor_walks" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "floor_walks_walker_idx" ON "floor_walks" USING btree ("walker_id");--> statement-breakpoint
CREATE INDEX "food_safety_events_site_idx" ON "food_safety_events" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "food_safety_events_shift_idx" ON "food_safety_events" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "food_safety_events_reported_by_idx" ON "food_safety_events" USING btree ("reported_by");--> statement-breakpoint
CREATE INDEX "huddles_site_idx" ON "huddles" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "huddles_shift_idx" ON "huddles" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "huddles_led_by_idx" ON "huddles" USING btree ("led_by");--> statement-breakpoint
CREATE INDEX "intake_events_site_idx" ON "intake_events" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "intake_events_supplier_idx" ON "intake_events" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "intake_events_shift_idx" ON "intake_events" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "intake_events_received_by_idx" ON "intake_events" USING btree ("received_by");--> statement-breakpoint
CREATE INDEX "kaizen_items_site_idx" ON "kaizen_items" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "kaizen_items_stop_idx" ON "kaizen_items" USING btree ("stop_id");--> statement-breakpoint
CREATE INDEX "kaizen_items_proposed_by_idx" ON "kaizen_items" USING btree ("proposed_by");--> statement-breakpoint
CREATE INDEX "kaizen_items_assigned_to_idx" ON "kaizen_items" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "quality_events_site_idx" ON "quality_events" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "quality_events_shift_idx" ON "quality_events" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "quality_events_reported_by_idx" ON "quality_events" USING btree ("reported_by");--> statement-breakpoint
CREATE INDEX "shifts_site_idx" ON "shifts" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "shifts_gm_idx" ON "shifts" USING btree ("gm_id");--> statement-breakpoint
CREATE INDEX "shifts_status_idx" ON "shifts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "standard_completions_standard_idx" ON "standard_completions" USING btree ("standard_id");--> statement-breakpoint
CREATE INDEX "standard_completions_user_idx" ON "standard_completions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "standard_completions_shift_idx" ON "standard_completions" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "standard_completions_site_idx" ON "standard_completions" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "standards_station_idx" ON "standards" USING btree ("station");--> statement-breakpoint
CREATE INDEX "standards_supersedes_idx" ON "standards" USING btree ("supersedes_id");--> statement-breakpoint
CREATE INDEX "standards_author_idx" ON "standards" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "standards_approved_by_idx" ON "standards" USING btree ("approved_by");--> statement-breakpoint
CREATE UNIQUE INDEX "standards_station_version_idx" ON "standards" USING btree ("station","version");--> statement-breakpoint
CREATE INDEX "stops_site_idx" ON "stops" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "stops_shift_idx" ON "stops" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "stops_category_idx" ON "stops" USING btree ("category");--> statement-breakpoint
CREATE INDEX "stops_raised_by_idx" ON "stops" USING btree ("raised_by");--> statement-breakpoint
CREATE INDEX "stops_resolved_by_idx" ON "stops" USING btree ("resolved_by");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_site_idx" ON "users" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");