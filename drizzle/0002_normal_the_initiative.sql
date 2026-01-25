CREATE TABLE `scanJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personaId` int NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`phase` enum('init','data_collection','llm_analysis','aggregation') NOT NULL DEFAULT 'init',
	`totalStocks` int NOT NULL DEFAULT 5500,
	`processedStocks` int NOT NULL DEFAULT 0,
	`opportunitiesFound` int NOT NULL DEFAULT 0,
	`llmAnalysesCompleted` int NOT NULL DEFAULT 0,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scanJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scanOpportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scanJobId` int NOT NULL,
	`personaId` int NOT NULL,
	`tickerId` int NOT NULL,
	`score` int NOT NULL,
	`rank` int,
	`metricsJson` json NOT NULL,
	`currentPrice` decimal(10,2),
	`marketCap` decimal(20,0),
	`sector` varchar(100),
	`status` enum('new','watched','purchased','dismissed') NOT NULL DEFAULT 'new',
	`llmAnalysisGenerated` boolean NOT NULL DEFAULT false,
	`dismissedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scanOpportunities_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_scan_ticker` UNIQUE(`scanJobId`,`tickerId`)
);
--> statement-breakpoint
CREATE TABLE `scanOpportunityAnalyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opportunityId` int NOT NULL,
	`personaId` int NOT NULL,
	`investmentThesis` text NOT NULL,
	`keyStrengths` json NOT NULL,
	`keyRisks` json NOT NULL,
	`catalystAnalysis` json NOT NULL,
	`confidenceLevel` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`recommendedAction` varchar(255),
	`analysisDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scanOpportunityAnalyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `scanJobs` ADD CONSTRAINT `scanJobs_personaId_personas_id_fk` FOREIGN KEY (`personaId`) REFERENCES `personas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scanOpportunities` ADD CONSTRAINT `scanOpportunities_scanJobId_scanJobs_id_fk` FOREIGN KEY (`scanJobId`) REFERENCES `scanJobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scanOpportunities` ADD CONSTRAINT `scanOpportunities_personaId_personas_id_fk` FOREIGN KEY (`personaId`) REFERENCES `personas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scanOpportunities` ADD CONSTRAINT `scanOpportunities_tickerId_tickers_id_fk` FOREIGN KEY (`tickerId`) REFERENCES `tickers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scanOpportunityAnalyses` ADD CONSTRAINT `scanOpportunityAnalyses_opportunityId_scanOpportunities_id_fk` FOREIGN KEY (`opportunityId`) REFERENCES `scanOpportunities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scanOpportunityAnalyses` ADD CONSTRAINT `scanOpportunityAnalyses_personaId_personas_id_fk` FOREIGN KEY (`personaId`) REFERENCES `personas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `persona_status_idx` ON `scanJobs` (`personaId`,`status`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `scanJobs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `scan_job_id_idx` ON `scanOpportunities` (`scanJobId`);--> statement-breakpoint
CREATE INDEX `persona_score_idx` ON `scanOpportunities` (`personaId`,`score`);--> statement-breakpoint
CREATE INDEX `scan_rank_idx` ON `scanOpportunities` (`scanJobId`,`rank`);--> statement-breakpoint
CREATE INDEX `opportunity_id_idx` ON `scanOpportunityAnalyses` (`opportunityId`);--> statement-breakpoint
CREATE INDEX `persona_id_idx` ON `scanOpportunityAnalyses` (`personaId`);