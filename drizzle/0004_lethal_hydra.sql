CREATE TABLE `opportunityRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scanRecordId` int NOT NULL,
	`personaId` int NOT NULL,
	`ticker` varchar(10) NOT NULL,
	`companyName` varchar(255),
	`sector` varchar(100),
	`rank` int NOT NULL,
	`investmentScore` int NOT NULL,
	`verdict` varchar(50),
	`confidence` decimal(3,2),
	`financialDataSnapshot` json NOT NULL,
	`investmentThesis` text,
	`summaryBullets` json,
	`keyStrengths` json,
	`keyRisks` json,
	`catalystAnalysis` json,
	`whatWouldChangeMind` json,
	`scoringCriteria` json,
	`dataUsed` json,
	`analyzedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `opportunityRecords_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_scan_ticker_record` UNIQUE(`scanRecordId`,`ticker`)
);
--> statement-breakpoint
CREATE TABLE `opportunityScanRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personaId` int NOT NULL,
	`status` enum('pending','phase1_filtering','phase2_analysis','completed','failed') NOT NULL DEFAULT 'pending',
	`phase1StartedAt` timestamp,
	`phase1CompletedAt` timestamp,
	`phase1StocksProcessed` int NOT NULL DEFAULT 0,
	`phase1CandidatesFound` int NOT NULL DEFAULT 0,
	`phase1ApiCallsUsed` int NOT NULL DEFAULT 0,
	`phase1CacheHits` int NOT NULL DEFAULT 0,
	`phase2StartedAt` timestamp,
	`phase2CompletedAt` timestamp,
	`phase2OpportunitiesAnalyzed` int NOT NULL DEFAULT 0,
	`phase2LlmCallsUsed` int NOT NULL DEFAULT 0,
	`phase2ApiCallsUsed` int NOT NULL DEFAULT 0,
	`phase2CacheHits` int NOT NULL DEFAULT 0,
	`opportunitiesStored` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`failedTickers` json,
	`totalDurationMs` int,
	`startedAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opportunityScanRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stockFinancialCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticker` varchar(10) NOT NULL,
	`companyName` varchar(255),
	`sector` varchar(100),
	`industry` varchar(100),
	`exchange` varchar(50),
	`currency` varchar(10) NOT NULL DEFAULT 'USD',
	`currentPrice` decimal(10,2),
	`marketCap` decimal(20,0),
	`volume` decimal(20,0),
	`peRatio` decimal(10,2),
	`pbRatio` decimal(10,2),
	`psRatio` decimal(10,2),
	`roe` decimal(10,2),
	`roa` decimal(10,2),
	`roic` decimal(10,2),
	`grossMargin` decimal(10,2),
	`operatingMargin` decimal(10,2),
	`netMargin` decimal(10,2),
	`debtToEquity` decimal(10,2),
	`currentRatio` decimal(10,2),
	`dividendYield` decimal(10,2),
	`financialDataJson` json NOT NULL,
	`refreshRequired` boolean NOT NULL DEFAULT false,
	`lastRefreshReason` varchar(255),
	`fetchedAt` timestamp NOT NULL,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockFinancialCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `stockFinancialCache_ticker_unique` UNIQUE(`ticker`)
);
--> statement-breakpoint
ALTER TABLE `opportunityRecords` ADD CONSTRAINT `opportunityRecords_scanRecordId_opportunityScanRecords_id_fk` FOREIGN KEY (`scanRecordId`) REFERENCES `opportunityScanRecords`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opportunityRecords` ADD CONSTRAINT `opportunityRecords_personaId_personas_id_fk` FOREIGN KEY (`personaId`) REFERENCES `personas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opportunityScanRecords` ADD CONSTRAINT `opportunityScanRecords_personaId_personas_id_fk` FOREIGN KEY (`personaId`) REFERENCES `personas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `scan_record_id_idx` ON `opportunityRecords` (`scanRecordId`);--> statement-breakpoint
CREATE INDEX `persona_ticker_idx` ON `opportunityRecords` (`personaId`,`ticker`);--> statement-breakpoint
CREATE INDEX `rank_idx` ON `opportunityRecords` (`scanRecordId`,`rank`);--> statement-breakpoint
CREATE INDEX `persona_status_idx` ON `opportunityScanRecords` (`personaId`,`status`);--> statement-breakpoint
CREATE INDEX `started_at_idx` ON `opportunityScanRecords` (`startedAt`);--> statement-breakpoint
CREATE INDEX `completed_at_idx` ON `opportunityScanRecords` (`completedAt`);--> statement-breakpoint
CREATE INDEX `ticker_idx` ON `stockFinancialCache` (`ticker`);--> statement-breakpoint
CREATE INDEX `sector_idx` ON `stockFinancialCache` (`sector`);--> statement-breakpoint
CREATE INDEX `refresh_required_idx` ON `stockFinancialCache` (`refreshRequired`);--> statement-breakpoint
CREATE INDEX `last_updated_idx` ON `stockFinancialCache` (`lastUpdated`);