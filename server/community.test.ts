import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

// The data layer is mocked so these assertions describe the router's
// authorization rules instead of depending on a reachable database.
vi.mock("./db", () => ({
  listCommunities: vi.fn(async () => []),
  getCommunityOverview: vi.fn(async () => ({
    community: undefined,
    channels: [],
    members: [],
  })),
  getChannelCommunityId: vi.fn(async () => 7),
  isCommunityMember: vi.fn(async () => false),
  listMessages: vi.fn(async () => []),
  createCommunity: vi.fn(async () => ({ id: 1 })),
  createMessage: vi.fn(async () => ({ id: 1 })),
  createDirectMessage: vi.fn(async () => ({ id: 1 })),
  listDirectMessages: vi.fn(async () => []),
  createRoomInvite: vi.fn(async () => ({ id: 1 })),
  listRoomInvites: vi.fn(async () => []),
  respondRoomInvite: vi.fn(async () => ({ success: true })),
  listNotifications: vi.fn(async () => []),
  markNotificationRead: vi.fn(async () => ({ success: true })),
  getOwnedAttachment: vi.fn(async () => undefined),
  getMessageRealtimeTarget: vi.fn(async () => null),
  updateMessage: vi.fn(async () => {
    throw new Error("Only the author can edit this message");
  }),
  deleteMessage: vi.fn(async () => {
    throw new Error("Only the author can delete this message");
  }),
  toggleMessageReaction: vi.fn(async () => ({ active: true })),
}));

vi.mock("./realtime", () => ({
  publishRealtimeEvent: vi.fn(async () => undefined),
}));

const { appRouter } = await import("./routers");
const db = await import("./db");

function createContext(user: TrpcContext["user"] = null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const member = {
  id: 1,
  openId: "sample-user",
  email: "sample@example.com",
  name: "Sample User",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const admin = { ...member, id: 2, role: "admin" as const };

beforeEach(() => {
  vi.mocked(db.isCommunityMember).mockResolvedValue(false);
  vi.mocked(db.getChannelCommunityId).mockResolvedValue(7);
});

describe("community router", () => {
  it("exposes a public community list", async () => {
    const result = await appRouter
      .createCaller(createContext())
      .community.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("validates message payloads before reaching persistence", async () => {
    const caller = appRouter.createCaller(createContext(member));
    await expect(
      caller.community.messages({ channelId: 0 })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.listMessages).not.toHaveBeenCalled();
  });

  it("keeps channel history behind authentication", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(
      caller.community.messages({ channelId: 4 })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(db.listMessages).not.toHaveBeenCalled();
  });

  it("refuses channel history to a non-member", async () => {
    const caller = appRouter.createCaller(createContext(member));
    await expect(
      caller.community.messages({ channelId: 4 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.listMessages).not.toHaveBeenCalled();
  });

  it("serves channel history to a member and scopes reactions to the viewer", async () => {
    vi.mocked(db.isCommunityMember).mockResolvedValue(true);
    const caller = appRouter.createCaller(createContext(member));
    await expect(caller.community.messages({ channelId: 4 })).resolves.toEqual(
      []
    );
    expect(db.listMessages).toHaveBeenCalledWith(4, member.id);
  });

  it("reports a missing channel instead of leaking an empty history", async () => {
    vi.mocked(db.getChannelCommunityId).mockResolvedValue(
      null as unknown as number
    );
    const caller = appRouter.createCaller(createContext(member));
    await expect(
      caller.community.messages({ channelId: 4 })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("keeps the community overview behind membership", async () => {
    await expect(
      appRouter
        .createCaller(createContext())
        .community.overview({ communityId: 7 })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      appRouter
        .createCaller(createContext(member))
        .community.overview({ communityId: 7 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.getCommunityOverview).not.toHaveBeenCalled();
  });

  it("lets an admin read a community it has not joined", async () => {
    const caller = appRouter.createCaller(createContext(admin));
    await expect(
      caller.community.overview({ communityId: 7 })
    ).resolves.toMatchObject({ channels: [] });
    await expect(caller.community.messages({ channelId: 4 })).resolves.toEqual(
      []
    );
  });

  it("rejects invalid direct-message recipients", async () => {
    const caller = appRouter.createCaller(createContext(member));
    await expect(
      caller.directMessage.list({ otherUserId: 0 })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("reads notifications for an authenticated user", async () => {
    const result = await appRouter
      .createCaller(createContext(member))
      .notification.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects unsafe attachment metadata", async () => {
    const caller = appRouter.createCaller(createContext(member));
    await expect(
      caller.directMessage.send({
        recipientId: 2,
        body: "arquivo",
        attachment: {
          key: "x",
          url: "https://example.com/file",
          name: "file.pdf",
          mimeType: "application/pdf",
          size: 12,
        },
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.directMessage.send({
        recipientId: 2,
        body: "arquivo",
        attachment: {
          key: "x",
          url: "/manus-storage/x",
          name: "file.pdf",
          mimeType: "application/pdf",
          size: 10 * 1024 * 1024 + 1,
        },
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects attachments owned by another session", async () => {
    const caller = appRouter.createCaller(createContext(member));
    await expect(
      caller.directMessage.send({
        recipientId: 2,
        body: "arquivo",
        attachment: {
          id: 999999,
          key: "x",
          url: "/manus-storage/x",
          name: "file.pdf",
          mimeType: "application/pdf",
          size: 12,
        },
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.createDirectMessage).not.toHaveBeenCalled();
  });

  it("protects message editing and deletion", async () => {
    const anonymousCaller = appRouter.createCaller(createContext());
    await expect(
      anonymousCaller.message.update({ messageId: 1, body: "novo texto" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      anonymousCaller.message.delete({ messageId: 1 })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    const authenticatedCaller = appRouter.createCaller(createContext(member));
    await expect(
      authenticatedCaller.message.update({ messageId: 1, body: "novo texto" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      authenticatedCaller.message.delete({ messageId: 1 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("protects room invites and validates their payload", async () => {
    const anonymousCaller = appRouter.createCaller(createContext());
    await expect(anonymousCaller.roomInvite.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    const authenticatedCaller = appRouter.createCaller(createContext(member));
    await expect(
      authenticatedCaller.roomInvite.create({
        recipientId: 0,
        communityId: 1,
        roomKey: "lobby",
        roomName: "Lobby",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      authenticatedCaller.roomInvite.create({
        recipientId: 2,
        communityId: 999999,
        roomKey: "lobby",
        roomName: "Lobby",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      authenticatedCaller.roomInvite.respond({
        inviteId: 0,
        status: "accepted",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("blocks a non-member from posting into a channel", async () => {
    const caller = appRouter.createCaller(createContext(member));
    await expect(
      caller.community.sendMessage({
        communityId: 7,
        channelId: 4,
        body: "olá",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.createMessage).not.toHaveBeenCalled();
  });
});
