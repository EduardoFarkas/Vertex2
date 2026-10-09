CREATE TABLE `form_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`pageId` int NOT NULL,
	`formId` varchar(160) NOT NULL DEFAULT 'contact',
	`name` varchar(180),
	`email` varchar(320),
	`phone` varchar(80),
	`message` text,
	`payload` json NOT NULL,
	`status` enum('new','in_review','qualified') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `form_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `pages` ADD `seoTitle` varchar(180);--> statement-breakpoint
ALTER TABLE `pages` ADD `seoDescription` varchar(320);--> statement-breakpoint
ALTER TABLE `pages` ADD `faviconUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `pages` ADD `openGraphImageUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `form_submissions` ADD CONSTRAINT `form_submissions_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `form_submissions` ADD CONSTRAINT `form_submissions_pageId_pages_id_fk` FOREIGN KEY (`pageId`) REFERENCES `pages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `submission_project_created_idx` ON `form_submissions` (`projectId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `submission_page_created_idx` ON `form_submissions` (`pageId`,`createdAt`);