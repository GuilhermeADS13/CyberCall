import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(user: TrpcContext["user"] = null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const authenticatedUser = {
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

describe("community router", () => {
  it("exposes a public community list", async () => {
    const result = await appRouter.createCaller(createContext()).community.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects invalid message payloads before reaching persistence", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.community.messages({ channelId: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects invalid direct-message recipients", async () => {
    const caller = appRouter.createCaller(createContext(authenticatedUser));
    await expect(caller.directMessage.list({ otherUserId: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("reads notifications for an authenticated user", async () => {
    const result = await appRouter.createCaller(createContext(authenticatedUser)).notification.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects unsafe attachment metadata", async () => {
    const caller = appRouter.createCaller(createContext(authenticatedUser));
    await expect(caller.directMessage.send({ recipientId: 2, body: "arquivo", attachment: { key: "x", url: "https://example.com/file", name: "file.pdf", mimeType: "application/pdf", size: 12 } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.directMessage.send({ recipientId: 2, body: "arquivo", attachment: { key: "x", url: "/manus-storage/x", name: "file.pdf", mimeType: "application/pdf", size: 10 * 1024 * 1024 + 1 } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects attachments owned by another session", async () => {
    const caller = appRouter.createCaller(createContext(authenticatedUser));
    await expect(caller.directMessage.send({ recipientId: 2, body: "arquivo", attachment: { id: 999999, key: "x", url: "/manus-storage/x", name: "file.pdf", mimeType: "application/pdf", size: 12 } })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("protects message editing and deletion", async () => {
    const anonymousCaller = appRouter.createCaller(createContext());
    await expect(anonymousCaller.message.update({ messageId: 1, body: "novo texto" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(anonymousCaller.message.delete({ messageId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    const authenticatedCaller = appRouter.createCaller(createContext(authenticatedUser));
    await expect(authenticatedCaller.message.update({ messageId: 1, body: "novo texto" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(authenticatedCaller.message.delete({ messageId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("protects room invites and validates their payload", async () => {
    const anonymousCaller = appRouter.createCaller(createContext());
    await expect(anonymousCaller.roomInvite.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    const authenticatedCaller = appRouter.createCaller(createContext(authenticatedUser));
    await expect(authenticatedCaller.roomInvite.create({ recipientId: 0, communityId: 1, roomKey: "lobby", roomName: "Lobby" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(authenticatedCaller.roomInvite.create({ recipientId: 2, communityId: 999999, roomKey: "lobby", roomName: "Lobby" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(authenticatedCaller.roomInvite.respond({ inviteId: 0, status: "accepted" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
