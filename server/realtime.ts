import type { IncomingMessage, Server as HttpServer } from "http";
import type { Request } from "express";
import { z } from "zod";
import { WebSocket, WebSocketServer } from "ws";
import { getChannelCommunityId, getCommunityMemberUserIds, getMemberCommunityIds, isCommunityMember } from "./db";
import { sdk, type AuthenticatedUser } from "./_core/sdk";

export const realtimePath = "/api/realtime";

export type RealtimeEvent = {
  id: string;
  type: "message.created" | "message.updated" | "message.deleted" | "dm.created" | "presence.updated" | "voice.members" | "voice.peer.joined" | "voice.peer.left" | "voice.offer" | "voice.answer" | "voice.ice" | "voice.chat" | "voice.typing";
  occurredAt: number;
  scope: { communityId?: number; channelId?: number; roomKey?: string; userIds?: number[] };
  payload: unknown;
};

type Subscription = { kind: "community" | "channel" | "dm"; id: number };
type RealtimeClient = { socket: WebSocket; user: AuthenticatedUser; subscriptions: Subscription[]; voiceRooms: Set<string> };

type RealtimeCommand =
  | { type: "subscribe"; communityId?: number; channelId?: number; dmUserId?: number }
  | { type: "unsubscribe"; communityId?: number; channelId?: number; dmUserId?: number }
  | { type: "presence.set"; status: "online" | "away" | "busy" | "invisible" }
  | { type: "voice.join"; channelId: number; roomKey: string }
  | { type: "voice.leave"; channelId: number; roomKey: string }
  | { type: "voice.offer" | "voice.answer"; channelId: number; roomKey: string; targetUserId: number; sdp: { type: string; sdp: string } }
  | { type: "voice.ice"; channelId: number; roomKey: string; targetUserId: number; candidate: Record<string, unknown> }
  | { type: "voice.chat"; channelId: number; roomKey: string; body: string }
  | { type: "voice.typing"; channelId: number; roomKey: string; typing: boolean }
  | { type: "ping" };

const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("subscribe"), communityId: z.number().int().positive().optional(), channelId: z.number().int().positive().optional(), dmUserId: z.number().int().positive().optional() }),
  z.object({ type: z.literal("unsubscribe"), communityId: z.number().int().positive().optional(), channelId: z.number().int().positive().optional(), dmUserId: z.number().int().positive().optional() }),
  z.object({ type: z.literal("presence.set"), status: z.enum(["online", "away", "busy", "invisible"]) }),
  z.object({ type: z.literal("voice.join"), channelId: z.number().int().positive(), roomKey: z.string().min(1).max(120) }),
  z.object({ type: z.literal("voice.leave"), channelId: z.number().int().positive(), roomKey: z.string().min(1).max(120) }),
  z.object({ type: z.union([z.literal("voice.offer"), z.literal("voice.answer")]), channelId: z.number().int().positive(), roomKey: z.string().min(1).max(120), targetUserId: z.number().int().positive(), sdp: z.object({ type: z.string().min(1).max(32), sdp: z.string().min(1).max(200_000) }) }),
  z.object({ type: z.literal("voice.ice"), channelId: z.number().int().positive(), roomKey: z.string().min(1).max(120), targetUserId: z.number().int().positive(), candidate: z.record(z.string(), z.unknown()) }),
  z.object({ type: z.literal("voice.chat"), channelId: z.number().int().positive(), roomKey: z.string().min(1).max(120), body: z.string().trim().min(1).max(2000) }),
  z.object({ type: z.literal("voice.typing"), channelId: z.number().int().positive(), roomKey: z.string().min(1).max(120), typing: z.boolean() }),
  z.object({ type: z.literal("ping") }),
]);

const clients = new Set<RealtimeClient>();
const voiceRooms = new Map<string, Set<number>>();

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

function voiceRoomKey(channelId: number, roomKey: string) {
  return `${channelId}:${roomKey}`;
}

function findClientByUserId(userId: number) {
  return Array.from(clients).find((client) => client.user.id === userId);
}

function sendVoiceEvent(socket: WebSocket, type: RealtimeEvent["type"], channelId: number, roomKey: string, payload: unknown) {
  send(socket, { id: nextEventId(), type, occurredAt: Date.now(), scope: { channelId, roomKey }, payload });
}

function broadcastVoiceChat(roomId: string, channelId: number, roomKey: string, payload: unknown) {
  voiceRooms.get(roomId)?.forEach((userId) => {
    const peer = findClientByUserId(userId);
    if (peer) sendVoiceEvent(peer.socket, "voice.chat", channelId, roomKey, payload);
  });
}

function broadcastVoiceTyping(roomId: string, channelId: number, roomKey: string, payload: unknown) {
  voiceRooms.get(roomId)?.forEach((userId) => {
    const peer = findClientByUserId(userId);
    if (peer) sendVoiceEvent(peer.socket, "voice.typing", channelId, roomKey, payload);
  });
}

function voiceMembers(roomId: string) {
  const members = Array.from(voiceRooms.get(roomId) || []);
  return members.map((userId) => {
    const client = findClientByUserId(userId);
    return { userId, name: client?.user.name || "Piloto" };
  });
}

function broadcastVoicePeerLeft(client: RealtimeClient, roomId: string, channelId: number, roomKey: string) {
  const peers = voiceRooms.get(roomId);
  peers?.delete(client.user.id);
  if (!peers || peers.size === 0) {
    voiceRooms.delete(roomId);
    return;
  }
  peers.forEach((userId) => {
    const peer = findClientByUserId(userId);
    if (peer) sendVoiceEvent(peer.socket, "voice.peer.left", channelId, roomKey, { userId: client.user.id });
  });
}

function leaveAllVoiceRooms(client: RealtimeClient) {
  client.voiceRooms.forEach((roomId) => {
    const [channelIdText, ...roomKeyParts] = roomId.split(":");
    broadcastVoicePeerLeft(client, roomId, Number(channelIdText), roomKeyParts.join(":"));
  });
  client.voiceRooms.clear();
}

export function matchesRealtimeSubscription(subscription: Subscription, eventType: RealtimeEvent["type"], scope: RealtimeEvent["scope"], userId: number) {
  if (eventType === "dm.created") return scope.userIds?.includes(userId) ?? false;
  if (eventType === "presence.updated") return subscription.kind === "community" && scope.communityId === subscription.id;
  return subscription.kind === "channel" && scope.channelId === subscription.id;
}

function matchingSubscription(client: RealtimeClient, event: RealtimeEvent) {
  return client.subscriptions.some((subscription) => matchesRealtimeSubscription(subscription, event.type, event.scope, client.user.id));
}

type SubscriptionCommand = Extract<RealtimeCommand, { type: "subscribe" }> | Extract<RealtimeCommand, { type: "unsubscribe" }>;

async function authorizeSubscription(userId: number, command: SubscriptionCommand): Promise<Subscription | null> {
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
  if (command.type === "voice.join" || command.type === "voice.leave" || command.type === "voice.offer" || command.type === "voice.answer" || command.type === "voice.ice" || command.type === "voice.chat" || command.type === "voice.typing") {
    const communityId = await getChannelCommunityId(command.channelId);
    if (!communityId || !(await isCommunityMember(communityId, client.user.id))) {
      protocolError(client.socket, "Você não pode sinalizar nesta sala.");
      return;
    }
    const roomId = voiceRoomKey(command.channelId, command.roomKey);
    if (command.type === "voice.join") {
      const peers = voiceRooms.get(roomId) || new Set<number>();
      const previousPeers = Array.from(peers);
      peers.add(client.user.id);
      voiceRooms.set(roomId, peers);
      client.voiceRooms.add(roomId);
      sendVoiceEvent(client.socket, "voice.members", command.channelId, command.roomKey, { members: voiceMembers(roomId).filter((member) => member.userId !== client.user.id) });
      previousPeers.forEach((userId) => {
        const peer = findClientByUserId(userId);
        if (peer) sendVoiceEvent(peer.socket, "voice.peer.joined", command.channelId, command.roomKey, { userId: client.user.id, name: client.user.name || "Piloto" });
      });
      return;
    }
    if (command.type === "voice.leave") {
      if (client.voiceRooms.has(roomId)) {
        broadcastVoicePeerLeft(client, roomId, command.channelId, command.roomKey);
        client.voiceRooms.delete(roomId);
      }
      return;
    }
    if (command.type === "voice.typing") {
      if (!client.voiceRooms.has(roomId)) {
        protocolError(client.socket, "Entre na sala antes de enviar o estado de digitação.");
        return;
      }
      broadcastVoiceTyping(roomId, command.channelId, command.roomKey, { userId: client.user.id, authorName: client.user.name || "Piloto", typing: command.typing });
      return;
    }
    if (command.type === "voice.chat") {
      if (!client.voiceRooms.has(roomId)) {
        protocolError(client.socket, "Entre na sala antes de enviar mensagens.");
        return;
      }
      broadcastVoiceChat(roomId, command.channelId, command.roomKey, { id: nextEventId(), userId: client.user.id, authorName: client.user.name || "Piloto", body: command.body.trim() });
      return;
    }
    if (!client.voiceRooms.has(roomId)) {
      protocolError(client.socket, "Entre na sala antes de enviar sinalização.");
      return;
    }
    const target = findClientByUserId(command.targetUserId);
    if (!target || !target.voiceRooms.has(roomId)) {
      protocolError(client.socket, "O peer alvo não está nesta sala.");
      return;
    }
    if (command.type === "voice.offer") sendVoiceEvent(target.socket, "voice.offer", command.channelId, command.roomKey, { fromUserId: client.user.id, sdp: command.sdp });
    if (command.type === "voice.answer") sendVoiceEvent(target.socket, "voice.answer", command.channelId, command.roomKey, { fromUserId: client.user.id, sdp: command.sdp });
    if (command.type === "voice.ice") sendVoiceEvent(target.socket, "voice.ice", command.channelId, command.roomKey, { fromUserId: client.user.id, candidate: command.candidate });
    return;
  }
  const subscription = await authorizeSubscription(client.user.id, command as SubscriptionCommand);
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
    const client: RealtimeClient = { socket, user, subscriptions: [], voiceRooms: new Set() };
    clients.add(client);
    socket.on("message", (raw) => {
      let parsed: unknown;
      try { parsed = JSON.parse(raw.toString()); } catch { protocolError(socket, "Comando inválido."); return; }
      const result = commandSchema.safeParse(parsed);
      if (!result.success) { protocolError(socket, "Comando realtime inválido."); return; }
      void handleCommand(client, result.data);
    });
    socket.on("close", () => { leaveAllVoiceRooms(client); clients.delete(client); });
    socket.on("error", () => { leaveAllVoiceRooms(client); clients.delete(client); });
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
  clients.forEach((client) => { leaveAllVoiceRooms(client); client.socket.close(); });
  clients.clear();
  voiceRooms.clear();
  presenceByUser.clear();
}
