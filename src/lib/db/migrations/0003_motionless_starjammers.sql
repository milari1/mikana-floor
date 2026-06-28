ALTER TABLE "standards" ALTER COLUMN "body_md" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "standard_completions" ADD COLUMN "step_index" integer;--> statement-breakpoint
ALTER TABLE "standard_completions" ADD COLUMN "step_name" text;--> statement-breakpoint
ALTER TABLE "standard_completions" ADD COLUMN "status" text DEFAULT 'done' NOT NULL;--> statement-breakpoint
ALTER TABLE "standard_completions" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "standards" ADD COLUMN "phase" text;--> statement-breakpoint
ALTER TABLE "standards" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "standards" ADD COLUMN "steps_json" jsonb;--> statement-breakpoint
CREATE INDEX "standards_station_phase_idx" ON "standards" USING btree ("station","phase");