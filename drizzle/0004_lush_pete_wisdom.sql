ALTER TABLE `directMessages` ADD `attachmentKey` varchar(512);--> statement-breakpoint
ALTER TABLE `directMessages` ADD `attachmentUrl` varchar(768);--> statement-breakpoint
ALTER TABLE `directMessages` ADD `attachmentName` varchar(255);--> statement-breakpoint
ALTER TABLE `directMessages` ADD `attachmentMimeType` varchar(120);--> statement-breakpoint
ALTER TABLE `directMessages` ADD `attachmentSize` int;--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentKey` varchar(512);--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentUrl` varchar(768);--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentName` varchar(255);--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentMimeType` varchar(120);--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentSize` int;