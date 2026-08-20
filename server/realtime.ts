import type { IncomingMessage, Server as HttpServer } from "http";
import type { Request } from "express";
import { z } from "zod";
import { WebSocket, WebSocketServer } from "ws";
import { getChannelCommunityId, getCommunityMemberUserIds, getMemberCommunityIds, isCommunityMember } from "./db";
import { sdk, type AuthenticatedUser } from "./_core/sdk";

export const realtimePath = "/api/realtime";

export type RealtimeEvent = {
  id: string;
  type: "message.created" | "message.updated" | "message.deleted" | "dm.created" | "presence.updated";
  occurredAt: number;
  scope: { communityId?: number; channelId?: number; userIds?: number[] };
  payload: unknown;
};

type Subscription = { kind: "community" | "channel" | "dm"; id: number };
type RealtimeClient = { socket: WebSocket; user: AuthenticatedUser; subscriptions: Subscription[] };

type RealtimeCommand =
  | { type: "subscribe"; communityId?: number; channelId?: number; dmUserId?: number }
  | { type: "unsubscribe"; communityId?: number; channelId?: number; dmUserId?: number }
  | { type: "presence.set"; status: "online" | "away" | "busy" | "invisible" }
  | { type: "ping" };

const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("subscribe"), communityId: z.number().int().positive().optional(), channelId: z.number().int().positive().optional(), dmUserId: z.number().int().positive().optional() }),
  z.object({ type: z.literal("unsubscribe"), communityId: z.number().int().positive().optional(), channelId: z.number().int().positive().optional(), dmUserId: z.number().int().positive().optional() }),
  z.object({ type: z.literal("presence.set"), status: z.enum(["online", "away", "busy", "invisible"]) }),
  z.object({ type: z.literal("ping") }),
]);

const clients = new Set<RealtimeClient>();

export function getBearerTokenFromWebSocketProtocols(protocolHeader: string | string[] | undefined) {
  const protocol = Array.isArray(protocolHeader) ? protocolHeader[0] : protocolHeader;
  return protocol && protocol.startsWith("bearer.") ? protocol.slice("bearer.".length) : undefined;
}

export function buildRealtimeAuthRequest(request: IncomingMessage, bearerToken?: string) {
  if (!bearerToken) return request;
  return Object.assign(request, { headers: { ...request.headers, authorization: `Bearer ${bearerToken}` } });
}

export function createPresenceSnapshotEvents(communityId: number, memberIds: number[], presenceLookup: (userId: number) => RealtimeEvent["payload"] | undefined) {
  return memberIds.flatMap((userId) => {
    const payload = presenceLookup(userId);
    return payload ? [{ type: "presence.updated" as const, scope: { communityId }, payload }] : [];
  });
}

const presenceByUser = new Map<number, RealtimeEvent["payload"]>();
let sequence = 0;

function nextEventId() {
  sequence = (sequence + 1) % Number.MAX_SAFE_INTEGER;
  return `${Date.now().toString(36)}-${sequence.toString(36)}`;
}

function send(socket: WebSocket, payload: unknown) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
}

function protocolError(socket: WebSocket, message: string) {
  send(socket, { type: "error", code: "BAD_COMMAND", message });
}

export function matchesRealtimeSubscription(subscription: Subscription, eventType: RealtimeEvent["type"], scope: RealtimeEvent["scope"], userId: number) {
  if (eventType === "dm.created") return scope.userIds?.includes(userId) ?? false;
  if (eventType === "presence.updated") return subscription.kind === "community" && scope.communityId === subscription.id;
  return subscription.kind === "channel" && scope.channelId === subscription.id;
}

function matchingSubscription(client: RealtimeClient, event: RealtimeEvent) {
  return client.subscriptions.some((subscription) => matchesRealtimeSubscription(subscription, event.type, event.scope, client.user.id));
}

async function authorizeSubscription(userId: number, command: { type: "subscribe" | "unsubscribe"; communityId?: number; channelId?: number; dmUserId?: number }): Promise<Subscription | null> {
  if (command.channelId) {
    const communityId = await getChannelCommunityId(command.channelId);
    if (!communityId || !(await isCommunityMember(communityId, userId))) return null;
    return { kind: "channel", id: command.channelId };
  }
  if (command.communityId) {
    if (!(await isCommunityMember(command.communityId, userId))) return null;
    return { kind: "community", id: command.communityId };
  }
  if (command.dmUserId && command.dmUserId !== userId) return { kind: "dm", id: command.dmUserId };
  return null;
}

async function handleCommand(client: RealtimeClient, command: RealtimeCommand) {
  if (command.type === "ping") {
    send(client.socket, { type: "pong", occurredAt: Date.now() });
    return;
  }
  if (command.type === "presence.set") {
    const payload = { userId: client.user.id, status: command.status };
    presenceByUser.set(client.user.id, payload);
    await publishPresence(client.user.id, payload);
    send(client.socket, { type: "presence.ack", payload });
    return;
  }
  const subscription = await authorizeSubscription(client.user.id, command);
  if (!subscription) {
    protocolError(client.socket, "Inscrição não autorizada para este sinal.");
    return;
  }
  const key = `${subscription.kind}:${subscription.id}`;
  if (command.type === "subscribe") {
    if (!client.subscriptions.some((item) => `${item.kind}:${item.id}` === key)) client.subscriptions.push(subscription);
    send(client.socket, { type: "subscribed", subscription });
    if (subscription.kind === "community") {
      const memberIds = await getCommunityMemberUserIds(subscription.id);
      createPresenceSnapshotEvents(subscription.id, memberIds, (userId) => presenceByUser.get(userId)).forEach((event) => {
        send(client.socket, { ...event, id: nextEventId(), occurredAt: Date.now() });
      });
    }
    return;
  }
  client.subscriptions = client.subscriptions.filter((item) => `${item.kind}:${item.id}` !== key);
  send(client.socket, { type: "unsubscribed", subscription });
}

async function authenticateConnection(socket: WebSocket, request: IncomingMessage) {
  try {
    const user = await sdk.authenticateRequest(request as unknown as Request);
    if (user.isCron || user.id <= 0) throw new Error("Realtime is not available to scheduled tasks");
    const client: RealtimeClient = { socket, user, subscriptions: [] };
    clients.add(client);
    socket.on("message", (raw) => {
      let parsed: unknown;
      try { parsed = JSON.parse(raw.toString()); } catch { protocolError(socket, "Comando inválido."); return; }
      const result = commandSchema.safeParse(parsed);
      if (!result.success) { protocolError(socket, "Comando realtime inválido."); return; }
      void handleCommand(client, result.data);
    });
    socket.on("close", () => clients.delete(client));
    socket.on("error", () => clients.delete(client));
    send(socket, { type: "ready", userId: user.id, occurredAt: Date.now() });
  } catch {
    socket.close(1008, "Sessão inválida");
  }
}

export async function publishRealtimeEvent(event: Omit<RealtimeEvent, "id" | "occurredAt">) {
  const completeEvent: RealtimeEvent = { ...event, id: nextEventId(), occurredAt: Date.now() };
  clients.forEach((client) => {
    if (matchingSubscription(client, completeEvent)) send(client.socket, completeEvent);
  });
  return completeEvent;
}

async function publishPresence(userId: number, payload: unknown) {
  const communityIds = await getMemberCommunityIds(userId);
  await Promise.all(communityIds.map((communityId) => publishRealtimeEvent({ type: "presence.updated", scope: { communityId }, payload })));
}

export function createRealtimeServer(server: HttpServer) {
  const websocketServer = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024, handleProtocols: (protocols) => protocols.values().next().value || "" });
  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    if (url.pathname !== realtimePath) return;
    websocketServer.handleUpgrade(request, socket, head, (clientSocket) => {
      const bearerToken = getBearerTokenFromWebSocketProtocols(request.headers["sec-websocket-protocol"]);
      void authenticateConnection(clientSocket, buildRealtimeAuthRequest(request, bearerToken));
    });
  });
  return websocketServer;
}

export function getRealtimePresence(userId: number) {
  return presenceByUser.get(userId);
}

export function resetRealtimeStateForTests() {
  clients.forEach((client) => client.socket.close());
  clients.clear();
  presenceByUser.clear();
}
