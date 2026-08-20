import {
  afterAll,
  beforeAll,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createServer, type Server } from "http";
import { WebSocket } from "ws";

const authenticateRequest = vi.fn(
  async (request: {
    headers: Record<string, string | string[] | undefined>;
  }) => {
    const authorization = request.headers.authorization;
    if (authorization === "Bearer jwt-token")
      return {
        id: 7,
        openId: "pilot-7",
        name: "Pilot 7",
        role: "user",
        isCron: false,
      };
    if (authorization === "Bearer jwt-token-8")
      return {
        id: 8,
        openId: "pilot-8",
        name: "Pilot 8",
        role: "user",
        isCron: false,
      };
    throw new Error("invalid session");
  }
);

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
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const info = server.address();
    if (!info || typeof info === "string")
      throw new Error("server address unavailable");
    address = `ws://127.0.0.1:${info.port}${realtime.realtimePath}`;
  });

  afterEach(() => {
    realtime.resetRealtimeStateForTests();
    authenticateRequest.mockClear();
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve()))
    );
  });

  async function openSocket(
    token: string,
    messages: Array<Record<string, unknown>>
  ) {
    const socket = new WebSocket(address, [`bearer.${token}`]);
    socket.on("message", raw => messages.push(JSON.parse(raw.toString())));
    await new Promise<void>((resolve, reject) => {
      socket.once("error", reject);
      socket.once("open", () => resolve());
    });
    return socket;
  }

  async function waitForMessage(
    messages: Array<Record<string, unknown>>,
    predicate: (message: Record<string, unknown>) => boolean
  ) {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const found = messages.find(predicate);
      if (found) return found;
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    return undefined;
  }

  it("authenticates with Bearer fallback, subscribes, and receives presence updates", async () => {
    const messages: Array<Record<string, unknown>> = [];
    const socket = await openSocket("jwt-token", messages);

    await new Promise<void>(resolve => {
      const timer = setInterval(() => {
        if (messages.some(message => message.type === "ready")) {
          clearInterval(timer);
          socket.send(JSON.stringify({ type: "subscribe", communityId: 4 }));
          resolve();
        }
      }, 5);
    });
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(authenticateRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: "Bearer jwt-token" }),
      })
    );
    expect(messages.some(message => message.type === "subscribed")).toBe(true);

    await realtime.publishRealtimeEvent({
      type: "presence.updated",
      scope: { communityId: 4 },
      payload: { userId: 7, status: "busy" },
    });
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(
      messages.some(
        message =>
          message.type === "presence.updated" &&
          (message.payload as { status?: string }).status === "busy"
      )
    ).toBe(true);
    socket.close();
  });

  it("routes voice chat only to participants in the same room and echoes the sender", async () => {
    const firstMessages: Array<Record<string, unknown>> = [];
    const secondMessages: Array<Record<string, unknown>> = [];
    const first = await openSocket("jwt-token", firstMessages);
    const second = await openSocket("jwt-token-8", secondMessages);
    first.send(
      JSON.stringify({
        type: "voice.join",
        channelId: 12,
        roomKey: "chat-room",
      })
    );
    second.send(
      JSON.stringify({
        type: "voice.join",
        channelId: 12,
        roomKey: "chat-room",
      })
    );
    expect(
      await waitForMessage(
        firstMessages,
        message => message.type === "voice.peer.joined"
      )
    ).toBeDefined();
    expect(
      await waitForMessage(
        secondMessages,
        message => message.type === "voice.members"
      )
    ).toBeDefined();

    first.send(
      JSON.stringify({
        type: "voice.chat",
        channelId: 12,
        roomKey: "chat-room",
        body: "  sinal de teste  ",
      })
    );
    const firstChat = await waitForMessage(
      firstMessages,
      message => message.type === "voice.chat"
    );
    const secondChat = await waitForMessage(
      secondMessages,
      message => message.type === "voice.chat"
    );
    expect(
      (firstChat?.payload as { userId?: number; body?: string }).userId
    ).toBe(7);
    expect((firstChat?.payload as { body?: string }).body).toBe(
      "sinal de teste"
    );
    expect(
      (secondChat?.payload as { userId?: number; body?: string }).userId
    ).toBe(7);
    first.close();
    second.close();
  });

  it("allows the author to edit/delete a room message and rejects another author", async () => {
    const firstMessages: Array<Record<string, unknown>> = [];
    const secondMessages: Array<Record<string, unknown>> = [];
    const first = await openSocket("jwt-token", firstMessages);
    const second = await openSocket("jwt-token-8", secondMessages);
    first.send(
      JSON.stringify({
        type: "voice.join",
        channelId: 12,
        roomKey: "edit-room",
      })
    );
    second.send(
      JSON.stringify({
        type: "voice.join",
        channelId: 12,
        roomKey: "edit-room",
      })
    );
    expect(
      await waitForMessage(
        firstMessages,
        message => message.type === "voice.peer.joined"
      )
    ).toBeDefined();
    expect(
      await waitForMessage(
        secondMessages,
        message => message.type === "voice.members"
      )
    ).toBeDefined();
    first.send(
      JSON.stringify({
        type: "voice.chat",
        channelId: 12,
        roomKey: "edit-room",
        body: "original",
      })
    );
    const created = await waitForMessage(
      secondMessages,
      message => message.type === "voice.chat"
    );
    const messageId = (created?.payload as { id?: string }).id;
    expect(messageId).toBeTruthy();
    second.send(
      JSON.stringify({
        type: "voice.chat.edit",
        channelId: 12,
        roomKey: "edit-room",
        messageId,
        body: "tentativa indevida",
      })
    );
    expect(
      (
        await waitForMessage(
          secondMessages,
          message => message.type === "error"
        )
      )?.message
    ).toContain("próprias");
    first.send(
      JSON.stringify({
        type: "voice.chat.edit",
        channelId: 12,
        roomKey: "edit-room",
        messageId,
        body: "atualizada",
      })
    );
    expect(
      (
        await waitForMessage(
          secondMessages,
          message => message.type === "voice.chat.updated"
        )
      )?.payload
    ).toMatchObject({ id: messageId, body: "atualizada", userId: 7 });
    first.send(
      JSON.stringify({
        type: "voice.chat.delete",
        channelId: 12,
        roomKey: "edit-room",
        messageId,
      })
    );
    expect(
      (
        await waitForMessage(
          secondMessages,
          message => message.type === "voice.chat.deleted"
        )
      )?.payload
    ).toMatchObject({ messageId, userId: 7 });
    first.close();
    second.close();
  });

  it("routes typing state only to participants in the same room", async () => {
    const firstMessages: Array<Record<string, unknown>> = [];
    const secondMessages: Array<Record<string, unknown>> = [];
    const first = await openSocket("jwt-token", firstMessages);
    const second = await openSocket("jwt-token-8", secondMessages);
    first.send(
      JSON.stringify({
        type: "voice.join",
        channelId: 12,
        roomKey: "typing-room",
      })
    );
    second.send(
      JSON.stringify({
        type: "voice.join",
        channelId: 12,
        roomKey: "typing-room",
      })
    );
    expect(
      await waitForMessage(
        firstMessages,
        message => message.type === "voice.peer.joined"
      )
    ).toBeDefined();
    expect(
      await waitForMessage(
        secondMessages,
        message => message.type === "voice.members"
      )
    ).toBeDefined();
    first.send(
      JSON.stringify({
        type: "voice.typing",
        channelId: 12,
        roomKey: "typing-room",
        typing: true,
      })
    );
    const received = await waitForMessage(
      secondMessages,
      message => message.type === "voice.typing"
    );
    expect(received?.payload).toMatchObject({
      userId: 7,
      authorName: "Pilot 7",
      typing: true,
    });
    first.send(
      JSON.stringify({
        type: "voice.typing",
        channelId: 12,
        roomKey: "typing-room",
        typing: false,
      })
    );
    const stopped = await waitForMessage(
      secondMessages,
      message =>
        message.type === "voice.typing" &&
        (message.payload as { typing?: boolean }).typing === false
    );
    expect(stopped?.payload).toMatchObject({ userId: 7, typing: false });
    first.close();
    second.close();
  });

  it("routes voice offers only to the authorized peer in the same room", async () => {
    const firstMessages: Array<Record<string, unknown>> = [];
    const secondMessages: Array<Record<string, unknown>> = [];
    const first = await openSocket("jwt-token", firstMessages);
    const second = await openSocket("jwt-token-8", secondMessages);
    first.send(
      JSON.stringify({ type: "voice.join", channelId: 12, roomKey: "lobby" })
    );
    second.send(
      JSON.stringify({ type: "voice.join", channelId: 12, roomKey: "lobby" })
    );
    expect(
      await waitForMessage(
        firstMessages,
        message => message.type === "voice.peer.joined"
      )
    ).toBeDefined();
    expect(
      await waitForMessage(
        secondMessages,
        message => message.type === "voice.members"
      )
    ).toBeDefined();

    first.send(
      JSON.stringify({
        type: "voice.offer",
        channelId: 12,
        roomKey: "lobby",
        targetUserId: 8,
        sdp: { type: "offer", sdp: "v=0" },
      })
    );
    const offer = await waitForMessage(
      secondMessages,
      message => message.type === "voice.offer"
    );
    expect(offer?.payload).toEqual({
      fromUserId: 7,
      sdp: { type: "offer", sdp: "v=0" },
    });
    expect(firstMessages.some(message => message.type === "voice.offer")).toBe(
      false
    );
    first.close();
    second.close();
  });
});
