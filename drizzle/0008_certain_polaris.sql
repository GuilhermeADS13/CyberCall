CREATE INDEX `attachments_owner_idx` ON `attachments` (`ownerId`);--> statement-breakpoint
CREATE INDEX `channels_community_position_idx` ON `channels` (`communityId`,`position`);--> statement-breakpoint
CREATE INDEX `communities_owner_idx` ON `communities` (`ownerId`);--> statement-breakpoint
CREATE INDEX `communityMembers_community_user_idx` ON `communityMembers` (`communityId`,`userId`);--> statement-breakpoint
CREATE INDEX `communityMembers_user_idx` ON `communityMembers` (`userId`);--> statement-breakpoint
CREATE INDEX `directMessages_pair_idx` ON `directMessages` (`senderId`,`recipientId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `directMessages_recipient_idx` ON `directMessages` (`recipientId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `messageReactions_message_idx` ON `messageReactions` (`messageId`);--> statement-breakpoint
CREATE INDEX `messageReactions_message_user_idx` ON `messageReactions` (`messageId`,`userId`);--> statement-breakpoint
CREATE INDEX `messages_channel_created_idx` ON `messages` (`channelId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `messages_author_idx` ON `messages` (`authorId`);--> statement-breakpoint
CREATE INDEX `notifications_user_created_idx` ON `notifications` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `roomInvites_recipient_status_idx` ON `roomInvites` (`recipientId`,`status`);--> statement-breakpoint
CREATE INDEX `roomInvites_community_idx` ON `roomInvites` (`communityId`);