CREATE TABLE `directMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`body` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `directMessages_id` PRIMARY KEY(`id`)
);
