CREATE TABLE `attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`key` varchar(512) NOT NULL,
	`url` varchar(768) NOT NULL,
	`name` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`size` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`),
	CONSTRAINT `attachments_key_unique` UNIQUE(`key`)
);
