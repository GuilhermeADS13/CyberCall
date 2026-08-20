import { describe, expect, it } from "vitest";
import {
  getBearerTokenFromWebSocketProtocols,
  buildRealtimeAuthRequest,
  createPresenceSnapshotEvents,
  matchesRealtimeSubscription,
} from "./realtime";

describe("realtime event routing", () => {
  it("matches a subscribed channel without crossing into another channel", () => {
    expect(
      matchesRealtimeSubscription(
        { kind: "channel", id: 12 },
        "message.created",
        { channelId: 12 },
        7
      )
    ).toBe(true);
    expect(
      matchesRealtimeSubscription(
        { kind: "channel", id: 12 },
        "message.created",
        { channelId: 13 },
        7
      )
    ).toBe(false);
  });

  it("matches a community subscription only for its community", () => {
    expect(
      matchesRealtimeSubscription(
        { kind: "community", id: 4 },
        "presence.updated",
        { communityId: 4 },
        7
      )
    ).toBe(true);
    expect(
      matchesRealtimeSubscription(
        { kind: "community", id: 4 },
        "presence.updated",
        { communityId: 5 },
        7
      )
    ).toBe(false);
  });

  it("delivers a DM only when the authenticated user is one of the participants", () => {
    expect(
      matchesRealtimeSubscription(
        { kind: "dm", id: 9 },
        "dm.created",
        { userIds: [7, 9] },
        7
      )
    ).toBe(true);
    expect(
      matchesRealtimeSubscription(
        { kind: "dm", id: 9 },
        "dm.created",
        { userIds: [7, 9] },
        11
      )
    ).toBe(false);
  });

  it("does not let a community presence subscription receive channel messages", () => {
    expect(
      matchesRealtimeSubscription(
        { kind: "community", id: 4 },
        "message.created",
        { communityId: 4, channelId: 12 },
        7
      )
    ).toBe(false);
  });

  it("extracts the preview Bearer token from the WebSocket protocol", () => {
    expect(getBearerTokenFromWebSocketProtocols("bearer.jwt-token")).toBe(
      "jwt-token"
    );
    expect(getBearerTokenFromWebSocketProtocols("other")).toBeUndefined();
  });

  it("builds the authenticated handshake request from the Bearer fallback", () => {
    const request = {
      headers: { host: "localhost" },
    } as import("http").IncomingMessage;
    const authenticated = buildRealtimeAuthRequest(request, "jwt-token");
    expect(authenticated.headers.authorization).toBe("Bearer jwt-token");
  });

  it("creates a presence snapshot only for members with a known state", () => {
    const events = createPresenceSnapshotEvents(4, [7, 8], userId =>
      userId === 7 ? { userId, status: "away" } : undefined
    );
    expect(events).toEqual([
      {
        type: "presence.updated",
        scope: { communityId: 4 },
        payload: { userId: 7, status: "away" },
      },
    ]);
  });
});
