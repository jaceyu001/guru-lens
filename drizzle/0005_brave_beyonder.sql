ALTER TABLE `opportunityRecords` ADD `hybridScore` decimal(5,2);--> statement-breakpoint
ALTER TABLE `opportunityRecords` ADD `buffettScore` decimal(5,2);--> statement-breakpoint
ALTER TABLE `opportunityRecords` ADD `woodScore` decimal(5,2);--> statement-breakpoint
ALTER TABLE `opportunityRecords` ADD `grahamScore` decimal(5,2);--> statement-breakpoint
ALTER TABLE `opportunityRecords` ADD `lyncheScore` decimal(5,2);--> statement-breakpoint
ALTER TABLE `opportunityRecords` ADD `fisherScore` decimal(5,2);--> statement-breakpoint
ALTER TABLE `opportunityRecords` ADD `fundamentalsAgentFindings` json;--> statement-breakpoint
ALTER TABLE `opportunityRecords` ADD `valuationAgentFindings` json;--> statement-breakpoint
ALTER TABLE `opportunityRecords` ADD `dataQualityFlags` json;