ALTER TABLE "kaizen_items" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "kaizen_items" ADD COLUMN "raw_text" text;--> statement-breakpoint
ALTER TABLE "kaizen_items" ADD COLUMN "audio_retain" boolean DEFAULT false NOT NULL;