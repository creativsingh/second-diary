CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entries_date_unique` ON `entries` (`date`);