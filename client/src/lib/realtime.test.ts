import { describe, expect, it, vi } from "vitest";
import {
  createRealtimeClient,
  getRealtimeReconnectDelay,
  rememberRealtimeEvent,
} from "./realtime";

describe("realtime client event deduplication", () => {
  it("ignores an event id already handled", () => {
    const seen = new Set<string>();
    expect(rememberRealtimeEvent(seen, "event-1")).toBe(true);
    expect(rememberRealtimeEvent(seen, "event-1")).toBe(false);
  });

  it("keeps the seen-event buffer bounded", () => {
    const seen = new Set<string>();
    rememberRealtimeEvent(seen, "event-1", 2);
    rememberRealtimeEvent(seen, "event-2", 2);
    rememberRealtimeEvent(seen, "event-3", 2);
    expect(seen.size).toBe(2);
    expect(seen.has("event-1")).toBe(false);
  });

  it("uses bounded exponential backoff for reconnection", () => {
    expect(getRealtimeReconnectDelay(1, 0)).toBe(1000);
    expect(getRealtimeReconnectDelay(4, 250)).toBe(8250);
    expect(getRealtimeReconnectDelay(9, 999)).toBe(8250);
  });

  it("reconnects and resends active subscriptions after the socket closes", async () => {
    class FakeSocket {
      static OPEN = 1;
      static instances: FakeSocket[] = [];
      readyState = 0;
      sent: string[] = [];
      private listeners = new Map<
        string,
        Array<(event?: { data?: string }) => void>
      >();
      constructor(
        public url: string,
        public protocols?: string[]
      ) {
        FakeSocket.instances.push(this);
      }
      addEventListener(
        type: string,
        listener: (event?: { data?: string }) => void
      ) {
        this.listeners.set(type, [
          ...(this.listeners.get(type) || []),
          listener,
        ]);
      }
      send(message: string) {
        this.sent.push(message);
      }
      close() {
        this.readyState = 3;
        this.listeners.get("close")?.forEach(listener => listener());
      }
      emit(type: "open" | "close") {
        if (type === "open") this.readyState = FakeSocket.OPEN;
        this.listeners.get(type)?.forEach(listener => listener());
      }
    }
    const previousWindow = (
      globalThis as typeof globalThis & { window?: unknown }
    ).window;
    const previousWebSocket = (
      globalThis as typeof globalThis & { WebSocket?: unknown }
    ).WebSocket;
    vi.useFakeTimers();
    const fakeWindow = {
      location: { protocol: "http:", host: "localhost" },
      sessionStorage: { getItem: () => null },
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
    };
    Object.assign(globalThis, { window: fakeWindow, WebSocket: FakeSocket });
    vi.spyOn(Math, "random").mockReturnValue(0);
    try {
      const client = createRealtimeClient({
        subscriptions: [{ communityId: 4 }, { channelId: 12 }],
        initialPresence: "online",
        onEvent: () => undefined,
      });
      const first = FakeSocket.instances[0];
      first.emit("open");
      expect(first.sent).toEqual([
        JSON.stringify({ type: "subscribe", communityId: 4 }),
        JSON.stringify({ type: "subscribe", channelId: 12 }),
        JSON.stringify({ type: "presence.set", status: "online" }),
      ]);
      first.emit("close");
      await vi.advanceTimersByTimeAsync(1000);
      const second = FakeSocket.instances[1];
      expect(second).toBeDefined();
      second.emit("open");
      expect(second.sent).toContain(
        JSON.stringify({ type: "subscribe", communityId: 4 })
      );
      expect(second.sent).toContain(
        JSON.stringify({ type: "subscribe", channelId: 12 })
      );
      client.close();
    } finally {
      vi.restoreAllMocks();
      vi.useRealTimers();
      if (previousWindow === undefined)
        delete (globalThis as typeof globalThis & { window?: unknown }).window;
      else
        (globalThis as typeof globalThis & { window?: unknown }).window =
          previousWindow;
      if (previousWebSocket === undefined)
        delete (globalThis as typeof globalThis & { WebSocket?: unknown })
          .WebSocket;
      else
        (globalThis as typeof globalThis & { WebSocket?: unknown }).WebSocket =
          previousWebSocket;
    }
  });
});
