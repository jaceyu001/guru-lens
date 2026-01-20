CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`alertType` enum('score_threshold','new_opportunity') NOT NULL,
	`tickerId` int,
	`personaId` int,
	`thresholdScore` int,
	`thresholdDirection` enum('above','below'),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastTriggered` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tickerId` int NOT NULL,
	`personaId` int NOT NULL,
	`runId` varchar(64) NOT NULL,
	`score` int NOT NULL,
	`verdict` enum('Strong Fit','Fit','Borderline','Not a Fit','Insufficient Data') NOT NULL,
	`confidence` decimal(3,2) NOT NULL,
	`summaryBullets` json NOT NULL,
	`criteria` json NOT NULL,
	`keyRisks` json NOT NULL,
	`whatWouldChangeMind` json NOT NULL,
	`dataUsed` json NOT NULL,
	`citations` json,
	`runMetadata` json NOT NULL,
	`runTimestamp` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyses_id` PRIMARY KEY(`id`),
	CONSTRAINT `analyses_runId_unique` UNIQUE(`runId`)
);
--> statement-breakpoint
CREATE TABLE `financialDataCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tickerId` int NOT NULL,
	`dataType` varchar(50) NOT NULL,
	`dataKey` varchar(100) NOT NULL,
	`data` json NOT NULL,
	`fetchedAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financialDataCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `ticker_data_type_key_idx` UNIQUE(`tickerId`,`dataType`,`dataKey`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobType` enum('ticker_analysis','daily_scan','deep_analysis') NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`params` json NOT NULL,
	`resultId` varchar(64),
	`progress` int NOT NULL DEFAULT 0,
	`statusMessage` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`errorMessage` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personaId` int NOT NULL,
	`tickerId` int NOT NULL,
	`analysisId` int NOT NULL,
	`scanDate` timestamp NOT NULL,
	`rank` int NOT NULL,
	`whyNow` json NOT NULL,
	`keyMetrics` json NOT NULL,
	`changeStatus` enum('new','improved','unchanged','dropped') NOT NULL,
	`previousScore` int,
	`scanTimestamp` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `opportunities_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_persona_ticker_date` UNIQUE(`personaId`,`tickerId`,`scanDate`)
);
--> statement-breakpoint
CREATE TABLE `personas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personaId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`investmentPhilosophy` text,
	`avatarUrl` varchar(512),
	`isActive` boolean NOT NULL DEFAULT true,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personas_id` PRIMARY KEY(`id`),
	CONSTRAINT `personas_personaId_unique` UNIQUE(`personaId`)
);
--> statement-breakpoint
CREATE TABLE `tickers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(10) NOT NULL,
	`companyName` varchar(255),
	`sector` varchar(100),
	`industry` varchar(100),
	`marketCap` decimal(20,2),
	`exchange` varchar(50),
	`description` text,
	`lastDataUpdate` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tickers_id` PRIMARY KEY(`id`),
	CONSTRAINT `tickers_symbol_unique` UNIQUE(`symbol`)
);
--> statement-breakpoint
CREATE TABLE `watchlistOpportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`opportunityId` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `watchlistOpportunities_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_opportunity_idx` UNIQUE(`userId`,`opportunityId`)
);
--> statement-breakpoint
CREATE TABLE `watchlistTickers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tickerId` int NOT NULL,
	`snapshotScore` int,
	`snapshotData` json,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `watchlistTickers_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_ticker_idx` UNIQUE(`userId`,`tickerId`)
);
--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_tickerId_tickers_id_fk` FOREIGN KEY (`tickerId`) REFERENCES `tickers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_personaId_personas_id_fk` FOREIGN KEY (`personaId`) REFERENCES `personas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analyses` ADD CONSTRAINT `analyses_tickerId_tickers_id_fk` FOREIGN KEY (`tickerId`) REFERENCES `tickers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analyses` ADD CONSTRAINT `analyses_personaId_personas_id_fk` FOREIGN KEY (`personaId`) REFERENCES `personas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financialDataCache` ADD CONSTRAINT `financialDataCache_tickerId_tickers_id_fk` FOREIGN KEY (`tickerId`) REFERENCES `tickers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opportunities` ADD CONSTRAINT `opportunities_personaId_personas_id_fk` FOREIGN KEY (`personaId`) REFERENCES `personas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opportunities` ADD CONSTRAINT `opportunities_tickerId_tickers_id_fk` FOREIGN KEY (`tickerId`) REFERENCES `tickers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opportunities` ADD CONSTRAINT `opportunities_analysisId_analyses_id_fk` FOREIGN KEY (`analysisId`) REFERENCES `analyses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watchlistOpportunities` ADD CONSTRAINT `watchlistOpportunities_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watchlistOpportunities` ADD CONSTRAINT `watchlistOpportunities_opportunityId_opportunities_id_fk` FOREIGN KEY (`opportunityId`) REFERENCES `opportunities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watchlistTickers` ADD CONSTRAINT `watchlistTickers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watchlistTickers` ADD CONSTRAINT `watchlistTickers_tickerId_tickers_id_fk` FOREIGN KEY (`tickerId`) REFERENCES `tickers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_active_idx` ON `alerts` (`userId`,`isActive`);--> statement-breakpoint
CREATE INDEX `ticker_persona_idx` ON `analyses` (`tickerId`,`personaId`);--> statement-breakpoint
CREATE INDEX `run_timestamp_idx` ON `analyses` (`runTimestamp`);--> statement-breakpoint
CREATE INDEX `expires_at_idx` ON `financialDataCache` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `jobs` (`status`);--> statement-breakpoint
CREATE INDEX `job_type_status_idx` ON `jobs` (`jobType`,`status`);--> statement-breakpoint
CREATE INDEX `persona_scan_date_idx` ON `opportunities` (`personaId`,`scanDate`);--> statement-breakpoint
CREATE INDEX `scan_date_idx` ON `opportunities` (`scanDate`);--> statement-breakpoint
CREATE INDEX `symbol_idx` ON `tickers` (`symbol`);