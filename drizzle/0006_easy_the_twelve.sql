CREATE TABLE `roomInvites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomKey` varchar(160) NOT NULL,
	`roomName` varchar(120) NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`status` enum('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	CONSTRAINT `roomInvites_id` PRIMARY KEY(`id`)
);
