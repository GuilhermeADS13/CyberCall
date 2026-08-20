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

  it("protects message editing and deletion", async () => {
    const anonymousCaller = appRouter.createCaller(createContext());
    await expect(anonymousCaller.message.update({ messageId: 1, body: "novo texto" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(anonymousCaller.message.delete({ messageId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    const authenticatedCaller = appRouter.createCaller(createContext(authenticatedUser));
    await expect(authenticatedCaller.message.update({ messageId: 1, body: "novo texto" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(authenticatedCaller.message.delete({ messageId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
