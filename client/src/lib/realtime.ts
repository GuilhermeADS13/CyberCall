import { COOKIE_NAME } from "@shared/const";

export type RealtimeEvent = {
  id: string;
  type: "message.created" | "message.updated" | "message.deleted" | "dm.created" | "presence.updated" | "voice.members" | "voice.peer.joined" | "voice.peer.left" | "voice.offer" | "voice.answer" | "voice.ice";
  occurredAt: number;
  scope: { communityId?: number; channelId?: number; roomKey?: string; userIds?: number[] };
  payload: any;
};

type RealtimeStatus = "connecting" | "connected" | "reconnecting" | "closed";
type Subscription = { communityId?: number; channelId?: number; dmUserId?: number };

export type RealtimeCommand =
  | { type: "subscribe"; communityId?: number; channelId?: number; dmUserId?: number }
  | { type: "unsubscribe"; communityId?: number; channelId?: number; dmUserId?: number }
  | { type: "presence.set"; status: "online" | "away" | "busy" | "invisible" }
  | { type: "voice.join" | "voice.leave"; channelId: number; roomKey: string }
  | { type: "voice.offer" | "voice.answer"; channelId: number; roomKey: string; targetUserId: number; sdp: { type: string; sdp: string } }
  | { type: "voice.ice"; channelId: number; roomKey: string; targetUserId: number; candidate: RTCIceCandidateInit }
  | { type: "ping" };

type RealtimeClientOptions = {
  subscriptions: Subscription[];
  initialPresence?: "online" | "away" | "busy" | "invisible";
  onEvent: (event: RealtimeEvent) => void;
  onStatus?: (status: RealtimeStatus) => void;
};

const MAX_SEEN_EVENTS = 300;
const MAX_RECONNECT_DELAY = 8000;

export function getRealtimeReconnectDelay(attempt: number, jitter = 0) {
  const baseDelay = Math.min(MAX_RECONNECT_DELAY, 500 * 2 ** Math.min(attempt, 4));
  return baseDelay + Math.max(0, Math.min(250, Math.round(jitter)));
}

export function rememberRealtimeEvent(seenEvents: Set<string>, eventId: string, limit = MAX_SEEN_EVENTS) {
  if (seenEvents.has(eventId)) return false;
  seenEvents.add(eventId);
  if (seenEvents.size > limit) {
    const oldest = seenEvents.values().next().value;
    if (oldest) seenEvents.delete(oldest);
  }
  return true;
}

export function createRealtimeClient({ subscriptions, initialPresence, onEvent, onStatus }: RealtimeClientOptions) {
  let socket: WebSocket | null = null;
  let reconnectTimer: number | undefined;
  let heartbeatTimer: number | undefined;
  let closedByUser = false;
  let attempt = 0;
  const seenEvents = new Set<string>();

  const reportStatus = (status: RealtimeStatus) => onStatus?.(status);

  const send = (message: unknown) => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  };

  const clearTimers = () => {
    if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
    if (heartbeatTimer !== undefined) window.clearInterval(heartbeatTimer);
    reconnectTimer = undefined;
    heartbeatTimer = undefined;
  };

  const scheduleReconnect = () => {
    if (closedByUser || reconnectTimer !== undefined) return;
    const jitter = Math.round(Math.random() * 250);
    attempt += 1;
    reportStatus("reconnecting");
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = undefined;
      connect();
    }, getRealtimeReconnectDelay(attempt, jitter));
  };

  const connect = () => {
    if (closedByUser) return;
    clearTimers();
    reportStatus(attempt === 0 ? "connecting" : "reconnecting");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    let bearerToken: string | undefined;
    try {
      const raw = window.sessionStorage.getItem("manus-cookie");
      const prefix = `${COOKIE_NAME}=`;
      const pair = raw?.split(";").find((item) => item.trim().startsWith(prefix));
      bearerToken = pair?.trim().slice(prefix.length) || undefined;
    } catch {
      bearerToken = undefined;
    }
    socket = new WebSocket(`${protocol}//${window.location.host}/api/realtime`, bearerToken ? [`bearer.${bearerToken}`] : undefined);
    socket.addEventListener("open", () => {
      attempt = 0;
      reportStatus("connected");
      subscriptions.forEach((subscription) => send({ type: "subscribe", ...subscription }));
      if (initialPresence) send({ type: "presence.set", status: initialPresence });
      heartbeatTimer = window.setInterval(() => send({ type: "ping" }), 25000);
    });
    socket.addEventListener("message", (message) => {
      let parsed: unknown;
      try { parsed = JSON.parse(message.data); } catch { return; }
      if (!parsed || typeof parsed !== "object") return;
      const event = parsed as Partial<RealtimeEvent>;
      if (!event.id || !event.type || !event.scope) return;
      if (!rememberRealtimeEvent(seenEvents, event.id)) return;
      onEvent(event as RealtimeEvent);
    });
    socket.addEventListener("error", () => socket?.close());
    socket.addEventListener("close", () => {
      clearTimers();
      socket = null;
      if (closedByUser) reportStatus("closed");
      else scheduleReconnect();
    });
  };

  connect();

  return {
    close() {
      closedByUser = true;
      clearTimers();
      socket?.close(1000, "client closing");
      socket = null;
      reportStatus("closed");
    },
    setPresence(status: "online" | "away" | "busy" | "invisible") {
      send({ type: "presence.set", status });
    },
    sendCommand(command: RealtimeCommand) {
      send(command);
    },
  };
}
