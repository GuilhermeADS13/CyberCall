import { and, asc, desc, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { communities, communityMembers, channels, directMessages, InsertUser, messageReactions, messages, notifications, users } from "../drizzle/schema";
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
  const rows = await db.select({ id: messages.id, channelId: messages.channelId, authorId: messages.authorId, body: messages.body, createdAt: messages.createdAt, editedAt: messages.editedAt, authorName: users.name }).from(messages).innerJoin(users, eq(users.id, messages.authorId)).where(eq(messages.channelId, channelId)).orderBy(asc(messages.createdAt)).limit(100);
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

export async function createMessage(channelId: number, authorId: number, body: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(messages).values({ channelId, authorId, body }).$returningId();
  const messageId = result[0]?.id;
  if (!messageId) throw new Error("Message creation failed");
  return (await db.select({ id: messages.id, channelId: messages.channelId, authorId: messages.authorId, body: messages.body, createdAt: messages.createdAt, editedAt: messages.editedAt, authorName: users.name }).from(messages).innerJoin(users, eq(users.id, messages.authorId)).where(eq(messages.id, messageId)).limit(1))[0];
}

export async function listDirectMessages(userId: number, otherUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: directMessages.id, senderId: directMessages.senderId, recipientId: directMessages.recipientId, body: directMessages.body, createdAt: directMessages.createdAt, readAt: directMessages.readAt, senderName: users.name }).from(directMessages).innerJoin(users, eq(users.id, directMessages.senderId)).where(or(and(eq(directMessages.senderId, userId), eq(directMessages.recipientId, otherUserId)), and(eq(directMessages.senderId, otherUserId), eq(directMessages.recipientId, userId)))).orderBy(asc(directMessages.createdAt)).limit(100);
}

export async function createDirectMessage(senderId: number, recipientId: number, body: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(directMessages).values({ senderId, recipientId, body }).$returningId();
  const messageId = result[0]?.id;
  if (!messageId) throw new Error("Direct message creation failed");
  await db.insert(notifications).values({ userId: recipientId, kind: "direct_message", title: "Novo sinal privado", body: "Você recebeu uma nova mensagem direta na Cyperpuck." });
  return (await db.select({ id: directMessages.id, senderId: directMessages.senderId, recipientId: directMessages.recipientId, body: directMessages.body, createdAt: directMessages.createdAt, readAt: directMessages.readAt, senderName: users.name }).from(directMessages).innerJoin(users, eq(users.id, directMessages.senderId)).where(eq(directMessages.id, messageId)).limit(1))[0];
}

export async function listNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
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
