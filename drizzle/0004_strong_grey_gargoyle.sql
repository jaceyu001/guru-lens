ALTER TABLE `personas` DROP INDEX `personas_personaId_unique`;--> statement-breakpoint
ALTER TABLE `analyses` ADD `personaId` int;--> statement-breakpoint
ALTER TABLE `analyses` ADD `runId` varchar(64);--> statement-breakpoint
ALTER TABLE `analyses` ADD `runTimestamp` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `analyses` ADD CONSTRAINT `analyses_runId_unique` UNIQUE(`runId`);--> statement-breakpoint
ALTER TABLE `personas` DROP COLUMN `personaId`;--> statement-breakpoint
ALTER TABLE `personas` DROP COLUMN `isActive`;--> statement-breakpoint
ALTER TABLE `personas` DROP COLUMN `displayOrder`;