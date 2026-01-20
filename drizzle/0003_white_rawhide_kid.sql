CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tickerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tickerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financialDataCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(10) NOT NULL,
	`data` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `financialDataCache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personaId` int NOT NULL,
	`tickerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`investmentPhilosophy` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `opportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`investmentPhilosophy` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `personas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tickers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tickers_id` PRIMARY KEY(`id`),
	CONSTRAINT `tickers_symbol_unique` UNIQUE(`symbol`)
);
--> statement-breakpoint
CREATE TABLE `watchlistOpportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`opportunityId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `watchlistOpportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watchlistTickers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tickerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `watchlistTickers_id` PRIMARY KEY(`id`)
);
