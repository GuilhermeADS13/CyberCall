import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("community router", () => {
  it("exposes a public community list", async () => {
    const result = await appRouter.createCaller(createContext()).community.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects invalid message payloads before reaching persistence", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.community.messages({ channelId: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
