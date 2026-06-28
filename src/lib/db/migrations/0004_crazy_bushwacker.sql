DROP INDEX "standards_station_version_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "standards_station_phase_version_idx" ON "standards" USING btree ("station","phase","version");