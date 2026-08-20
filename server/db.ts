import { and, asc, desc, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { attachments, communities, communityMembers, channels, directMessages, InsertUser, messageReactions, messages, notifications, roomInvites, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listCommunities() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communities).orderBy(desc(communities.createdAt));
}

export async function getCommunityOverview(communityId: number) {
  const db = await getDb();
  if (!db) return { community: undefined, channels: [], members: [] };
  const [communityRows, channelRows, memberRows] = await Promise.all([
    db.select().from(communities).where(eq(communities.id, communityId)).limit(1),
    db.select().from(channels).where(eq(channels.communityId, communityId)).orderBy(asc(channels.position), asc(channels.id)),
    db.select({ id: communityMembers.id, userId: communityMembers.userId, memberRole: communityMembers.memberRole, status: communityMembers.status, name: users.name, email: users.email }).from(communityMembers).innerJoin(users, eq(users.id, communityMembers.userId)).where(eq(communityMembers.communityId, communityId)).orderBy(asc(users.name)),
  ]);
  return { community: communityRows[0], channels: channelRows, members: memberRows };
}

export async function listMessages(channelId: number, viewerId = 0) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ id: messages.id, channelId: messages.channelId, authorId: messages.authorId, body: messages.body, attachmentKey: messages.attachmentKey, attachmentUrl: messages.attachmentUrl, attachmentName: messages.attachmentName, attachmentMimeType: messages.attachmentMimeType, attachmentSize: messages.attachmentSize, createdAt: messages.createdAt, editedAt: messages.editedAt, authorName: users.name }).from(messages).innerJoin(users, eq(users.id, messages.authorId)).where(eq(messages.channelId, channelId)).orderBy(asc(messages.createdAt)).limit(100);
  return Promise.all(rows.map(async (row) => {
    const reactions = await db.select({ userId: messageReactions.userId }).from(messageReactions).where(eq(messageReactions.messageId, row.id));
    return { ...row, reactionCount: reactions.length, reactedByMe: reactions.some((reaction) => reaction.userId === viewerId) };
  }));
}

export async function createCommunity(ownerId: number, name: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;
  const communityResult = await db.insert(communities).values({ ownerId, name, slug, description: description || null }).$returningId();
  const communityId = communityResult[0]?.id;
  if (!communityId) throw new Error("Community creation failed");
  await db.insert(communityMembers).values({ communityId, userId: ownerId, memberRole: "owner", status: "online" });
  await db.insert(channels).values([{ communityId, name: "rules", channelType: "announcement", position: 0 }, { communityId, name: "general", channelType: "text", position: 1 }, { communityId, name: "lobby", channelType: "voice", position: 2 }]);
  const created = await db.select().from(communities).where(eq(communities.id, communityId)).limit(1);
  return created[0];
}

export type AttachmentMeta = { id?: number; key: string; url: string; name: string; mimeType: string; size: number };

export async function createAttachment(ownerId: number, attachment: Omit<AttachmentMeta, "id">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(attachments).values({ ownerId, key: attachment.key, url: attachment.url, name: attachment.name, mimeType: attachment.mimeType, size: attachment.size }).$returningId();
  if (!result[0]?.id) throw new Error("Attachment record creation failed");
  return { id: result[0].id, ...attachment };
}

export async function getOwnedAttachment(attachmentId: number, ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.select().from(attachments).where(and(eq(attachments.id, attachmentId), eq(attachments.ownerId, ownerId))).limit(1);
  return result[0];
}

export async function createMessage(channelId: number, authorId: number, body: string, attachment?: AttachmentMeta) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(messages).values({ channelId, authorId, body, attachmentKey: attachment?.key, attachmentUrl: attachment?.url, attachmentName: attachment?.name, attachmentMimeType: attachment?.mimeType, attachmentSize: attachment?.size }).$returningId();
  const messageId = result[0]?.id;
  if (!messageId) throw new Error("Message creation failed");
  return (await db.select({ id: messages.id, channelId: messages.channelId, authorId: messages.authorId, body: messages.body, attachmentKey: messages.attachmentKey, attachmentUrl: messages.attachmentUrl, attachmentName: messages.attachmentName, attachmentMimeType: messages.attachmentMimeType, attachmentSize: messages.attachmentSize, createdAt: messages.createdAt, editedAt: messages.editedAt, authorName: users.name }).from(messages).innerJoin(users, eq(users.id, messages.authorId)).where(eq(messages.id, messageId)).limit(1))[0];
}

export async function getMessageRealtimeTarget(messageId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ id: messages.id, channelId: messages.channelId, communityId: channels.communityId }).from(messages).innerJoin(channels, eq(channels.id, messages.channelId)).where(eq(messages.id, messageId)).limit(1);
  return rows[0] ?? null;
}

export async function updateMessage(messageId: number, authorId: number, body: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select({ id: messages.id, authorId: messages.authorId }).from(messages).where(eq(messages.id, messageId)).limit(1);
  if (!existing[0] || existing[0].authorId !== authorId) throw new Error("Only the author can edit this message");
  await db.update(messages).set({ body, editedAt: new Date() }).where(eq(messages.id, messageId));
  return { success: true } as const;
}

export async function deleteMessage(messageId: number, authorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select({ id: messages.id, authorId: messages.authorId }).from(messages).where(eq(messages.id, messageId)).limit(1);
  if (!existing[0] || existing[0].authorId !== authorId) throw new Error("Only the author can delete this message");
  await db.delete(messages).where(eq(messages.id, messageId));
  return { success: true } as const;
}

export async function listDirectMessages(userId: number, otherUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: directMessages.id, senderId: directMessages.senderId, recipientId: directMessages.recipientId, body: directMessages.body, attachmentKey: directMessages.attachmentKey, attachmentUrl: directMessages.attachmentUrl, attachmentName: directMessages.attachmentName, attachmentMimeType: directMessages.attachmentMimeType, attachmentSize: directMessages.attachmentSize, createdAt: directMessages.createdAt, readAt: directMessages.readAt, senderName: users.name }).from(directMessages).innerJoin(users, eq(users.id, directMessages.senderId)).where(or(and(eq(directMessages.senderId, userId), eq(directMessages.recipientId, otherUserId)), and(eq(directMessages.senderId, otherUserId), eq(directMessages.recipientId, userId)))).orderBy(asc(directMessages.createdAt)).limit(100);
}

export async function createDirectMessage(senderId: number, recipientId: number, body: string, attachment?: AttachmentMeta) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(directMessages).values({ senderId, recipientId, body, attachmentKey: attachment?.key, attachmentUrl: attachment?.url, attachmentName: attachment?.name, attachmentMimeType: attachment?.mimeType, attachmentSize: attachment?.size }).$returningId();
  const messageId = result[0]?.id;
  if (!messageId) throw new Error("Direct message creation failed");
  await db.insert(notifications).values({ userId: recipientId, kind: "direct_message", title: "Novo sinal privado", body: "Você recebeu uma nova mensagem direta na Cyperpuck." });
  return (await db.select({ id: directMessages.id, senderId: directMessages.senderId, recipientId: directMessages.recipientId, body: directMessages.body, attachmentKey: directMessages.attachmentKey, attachmentUrl: directMessages.attachmentUrl, attachmentName: directMessages.attachmentName, attachmentMimeType: directMessages.attachmentMimeType, attachmentSize: directMessages.attachmentSize, createdAt: directMessages.createdAt, readAt: directMessages.readAt, senderName: users.name }).from(directMessages).innerJoin(users, eq(users.id, directMessages.senderId)).where(eq(directMessages.id, messageId)).limit(1))[0];
}

export async function listNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function createRoomInvite(senderId: number, recipientId: number, communityId: number, roomKey: string, roomName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const result = await db.insert(roomInvites).values({ communityId, senderId, recipientId, roomKey, roomName, expiresAt }).$returningId();
  const inviteId = result[0]?.id;
  if (!inviteId) throw new Error("Room invite creation failed");
  await db.insert(notifications).values({ userId: recipientId, kind: "room_invite", title: "Convite de sala recebido", body: `Você foi convidado para entrar na sala ${roomName}.` });
  return { id: inviteId, roomKey, roomName, expiresAt };
}

export async function listRoomInvites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ id: roomInvites.id, roomKey: roomInvites.roomKey, roomName: roomInvites.roomName, status: roomInvites.status, expiresAt: roomInvites.expiresAt, createdAt: roomInvites.createdAt, senderName: users.name }).from(roomInvites).innerJoin(users, eq(users.id, roomInvites.senderId)).where(and(eq(roomInvites.recipientId, userId), eq(roomInvites.status, "pending"))).orderBy(desc(roomInvites.createdAt)).limit(20);
  const now = Date.now();
  return rows.filter((row) => row.expiresAt.getTime() > now);
}

export async function respondRoomInvite(inviteId: number, userId: number, status: "accepted" | "declined") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select({ id: roomInvites.id, senderId: roomInvites.senderId, roomKey: roomInvites.roomKey, expiresAt: roomInvites.expiresAt, status: roomInvites.status }).from(roomInvites).where(and(eq(roomInvites.id, inviteId), eq(roomInvites.recipientId, userId))).limit(1);
  if (!existing[0]) throw new Error("Room invite not found");
  if (existing[0].status !== "pending") throw new Error("Room invite already answered");
  if (existing[0].expiresAt.getTime() <= Date.now()) {
    await db.update(roomInvites).set({ status: "expired", respondedAt: new Date() }).where(eq(roomInvites.id, inviteId));
    throw new Error("Room invite expired");
  }
  await db.update(roomInvites).set({ status, respondedAt: new Date() }).where(eq(roomInvites.id, inviteId));
  await db.insert(notifications).values({ userId: existing[0].senderId, kind: "room_invite_response", title: status === "accepted" ? "Convite aceito" : "Convite recusado", body: status === "accepted" ? "Seu convite de sala foi aceito." : "Seu convite de sala foi recusado." });
  return { success: true, status, roomKey: existing[0].roomKey } as const;
}

export async function markNotificationRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  return { success: true } as const;
}

export async function toggleMessageReaction(messageId: number, userId: number, emoji: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select({ id: messageReactions.id }).from(messageReactions).where(and(eq(messageReactions.messageId, messageId), eq(messageReactions.userId, userId), eq(messageReactions.emoji, emoji))).limit(1);
  if (existing[0]) {
    await db.delete(messageReactions).where(eq(messageReactions.id, existing[0].id));
    return { active: false } as const;
  }
  await db.insert(messageReactions).values({ messageId, userId, emoji });
  return { active: true } as const;
}

export async function isCommunityMember(communityId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: communityMembers.id }).from(communityMembers).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId))).limit(1);
  return result.length > 0;
}

export async function getChannelCommunityId(channelId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({ communityId: channels.communityId }).from(channels).where(eq(channels.id, channelId)).limit(1);
  return result[0]?.communityId ?? null;
}

export async function getMemberCommunityIds(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ communityId: communityMembers.communityId }).from(communityMembers).where(eq(communityMembers.userId, userId));
  return rows.map((row) => row.communityId);
}

export async function getCommunityMemberUserIds(communityId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ userId: communityMembers.userId }).from(communityMembers).where(eq(communityMembers.communityId, communityId));
  return rows.map((row) => row.userId);
}
