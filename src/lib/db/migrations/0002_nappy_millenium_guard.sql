ALTER TABLE "stops" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "stops" ADD COLUMN "station" text;--> statement-breakpoint
ALTER TABLE "stops" ADD COLUMN "subcategory" text;--> statement-breakpoint
ALTER TABLE "stops" ADD COLUMN "opened_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "stops" ADD COLUMN "root_cause" text;--> statement-breakpoint
CREATE INDEX "stops_opened_at_idx" ON "stops" USING btree ("opened_at");