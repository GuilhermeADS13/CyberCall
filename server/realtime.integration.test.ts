import { afterAll, beforeAll, afterEach, describe, expect, it, vi } from "vitest";
import { createServer, type Server } from "http";
import { WebSocket } from "ws";

const authenticateRequest = vi.fn(async (request: { headers: Record<string, string | string[] | undefined> }) => {
  if (request.headers.authorization !== "Bearer jwt-token") throw new Error("invalid session");
  return { id: 7, openId: "pilot-7", name: "Pilot 7", role: "user", isCron: false };
});

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest } }));
vi.mock("./db", () => ({
  getChannelCommunityId: vi.fn(async () => 4),
  getCommunityMemberUserIds: vi.fn(async () => [7]),
  getMemberCommunityIds: vi.fn(async () => [4]),
  isCommunityMember: vi.fn(async () => true),
}));

describe("realtime WebSocket integration", () => {
  let server: Server;
  let realtime: typeof import("./realtime");
  let address: string;

  beforeAll(async () => {
    realtime = await import("./realtime");
    server = createServer();
    realtime.createRealtimeServer(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const info = server.address();
    if (!info || typeof info === "string") throw new Error("server address unavailable");
    address = `ws://127.0.0.1:${info.port}${realtime.realtimePath}`;
  });

  afterEach(() => {
    realtime.resetRealtimeStateForTests();
    authenticateRequest.mockClear();
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("authenticates with Bearer fallback, subscribes, and receives presence updates", async () => {
    const socket = new WebSocket(address, ["bearer.jwt-token"]);
    const messages: Array<Record<string, unknown>> = [];
    socket.on("message", (raw) => messages.push(JSON.parse(raw.toString())));
    await new Promise<void>((resolve, reject) => {
      socket.once("error", reject);
      socket.once("open", () => resolve());
    });

    await new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        if (messages.some((message) => message.type === "ready")) {
          clearInterval(timer);
          socket.send(JSON.stringify({ type: "subscribe", communityId: 4 }));
          resolve();
        }
      }, 5);
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(authenticateRequest).toHaveBeenCalledWith(expect.objectContaining({ headers: expect.objectContaining({ authorization: "Bearer jwt-token" }) }));
    expect(messages.some((message) => message.type === "subscribed")).toBe(true);

    await realtime.publishRealtimeEvent({ type: "presence.updated", scope: { communityId: 4 }, payload: { userId: 7, status: "busy" } });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(messages.some((message) => message.type === "presence.updated" && (message.payload as { status?: string }).status === "busy")).toBe(true);
    socket.close();
  });
});
