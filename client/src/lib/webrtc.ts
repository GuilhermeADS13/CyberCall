export type VoiceSignalEvent = {
  type:
    | "voice.members"
    | "voice.peer.joined"
    | "voice.peer.left"
    | "voice.offer"
    | "voice.answer"
    | "voice.ice";
  payload: any;
};

export type NetworkQualityLevel = "good" | "unstable" | "poor" | "unavailable";

export type NetworkQuality = {
  level: NetworkQualityLevel;
  rttMs?: number;
  lossRate?: number;
};

export function classifyNetworkQuality(input: {
  rttMs?: number;
  lossRate?: number;
  connected?: boolean;
}): NetworkQualityLevel {
  if (input.connected === false) return "unavailable";
  if (input.rttMs === undefined && input.lossRate === undefined)
    return input.connected ? "unstable" : "unavailable";
  if ((input.rttMs ?? 0) <= 150 && (input.lossRate ?? 0) <= 0.02) return "good";
  if ((input.rttMs ?? 0) <= 300 && (input.lossRate ?? 0) <= 0.08)
    return "unstable";
  return "poor";
}

export type WebRtcMeshOptions = {
  channelId: number;
  roomKey: string;
  localUserId: number;
  sendSignal: (command: any) => void;
  onRemoteStream?: (userId: number, stream: MediaStream) => void;
  onPeerState?: (
    userId: number,
    state: "connecting" | "connected" | "disconnected"
  ) => void;
  onPeerQuality?: (userId: number, quality: NetworkQuality) => void;
  rtcConfiguration?: RTCConfiguration;
};

function parseIceUrls(value: string | undefined, fallback: string[] = []) {
  const urls = (value ?? "")
    .split(",")
    .map(entry => entry.trim())
    .filter(Boolean);
  return urls.length > 0 ? urls : fallback;
}

/**
 * STUN alone only solves the easy NATs. Symmetric NAT, corporate firewalls and
 * a good share of mobile carriers need a TURN relay, so the servers are read
 * from the environment instead of being pinned to a single public STUN host.
 */
export function buildRtcConfiguration(
  env: Record<string, string | undefined> = import.meta
    .env as unknown as Record<string, string | undefined>
): RTCConfiguration {
  const iceServers: RTCIceServer[] = [
    {
      urls: parseIceUrls(env.VITE_STUN_URLS, ["stun:stun.l.google.com:19302"]),
    },
  ];
  const turnUrls = parseIceUrls(env.VITE_TURN_URLS);
  if (turnUrls.length > 0) {
    iceServers.push({
      urls: turnUrls,
      username: env.VITE_TURN_USERNAME,
      credential: env.VITE_TURN_CREDENTIAL,
    });
  }
  return { iceServers };
}

export const defaultRtcConfiguration: RTCConfiguration =
  buildRtcConfiguration();

export function hasTurnRelay(
  configuration: RTCConfiguration = defaultRtcConfiguration
) {
  return (configuration.iceServers ?? []).some(server => {
    const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
    return urls.some(url => typeof url === "string" && url.startsWith("turn"));
  });
}

export function getMediaConstraints(
  audio: boolean,
  video: boolean,
  devices?: { audioDeviceId?: string; videoDeviceId?: string }
): MediaStreamConstraints {
  return {
    audio: audio
      ? devices?.audioDeviceId
        ? { deviceId: { exact: devices.audioDeviceId } }
        : true
      : false,
    video: video
      ? devices?.videoDeviceId
        ? { deviceId: { exact: devices.videoDeviceId } }
        : true
      : false,
  };
}

export function createWebRtcMesh(options: WebRtcMeshOptions) {
  const peers = new Map<number, RTCPeerConnection>();
  const statsTimers = new Map<number, ReturnType<typeof setInterval>>();
  let localStream: MediaStream | null = null;
  let closed = false;

  const send = (command: unknown) => {
    if (!closed) options.sendSignal(command);
  };

  const attachLocalTracks = (peer: RTCPeerConnection) => {
    localStream?.getTracks().forEach(track => {
      if (!peer.getSenders().some(sender => sender.track?.id === track.id))
        peer.addTrack(track, localStream as MediaStream);
    });
  };

  const collectPeerQuality = async (
    userId: number,
    peer: RTCPeerConnection
  ) => {
    if (closed || !peers.has(userId)) return;
    try {
      const stats = await peer.getStats();
      let rttMs: number | undefined;
      let packetsLost = 0;
      let packetsReceived = 0;
      stats.forEach((report: any) => {
        if (
          report.type === "candidate-pair" &&
          (report.state === "succeeded" || report.nominated) &&
          typeof report.currentRoundTripTime === "number"
        )
          rttMs = report.currentRoundTripTime * 1000;
        if (
          report.type === "inbound-rtp" &&
          report.kind !== "audio" &&
          report.mediaType !== "audio"
        ) {
          if (typeof report.packetsLost === "number")
            packetsLost += Math.max(0, report.packetsLost);
          if (typeof report.packetsReceived === "number")
            packetsReceived += Math.max(0, report.packetsReceived);
        }
      });
      const totalPackets = packetsLost + packetsReceived;
      const lossRate =
        totalPackets > 0 ? packetsLost / totalPackets : undefined;
      options.onPeerQuality?.(userId, {
        level: classifyNetworkQuality({
          rttMs,
          lossRate,
          connected: peer.connectionState === "connected",
        }),
        rttMs,
        lossRate,
      });
    } catch {
      options.onPeerQuality?.(userId, { level: "unavailable" });
    }
  };

  const startPeerStats = (userId: number, peer: RTCPeerConnection) => {
    if (statsTimers.has(userId)) return;
    void collectPeerQuality(userId, peer);
    statsTimers.set(
      userId,
      setInterval(() => void collectPeerQuality(userId, peer), 2500)
    );
  };

  const stopPeerStats = (userId: number) => {
    const timer = statsTimers.get(userId);
    if (timer) clearInterval(timer);
    statsTimers.delete(userId);
  };

  const ensurePeer = (userId: number) => {
    const existing = peers.get(userId);
    if (existing) return existing;
    const peer = new RTCPeerConnection(
      options.rtcConfiguration || defaultRtcConfiguration
    );
    peers.set(userId, peer);
    attachLocalTracks(peer);
    startPeerStats(userId, peer);
    options.onPeerState?.(userId, "connecting");
    peer.onicecandidate = event => {
      if (!event.candidate) return;
      send({
        type: "voice.ice",
        channelId: options.channelId,
        roomKey: options.roomKey,
        targetUserId: userId,
        candidate: event.candidate.toJSON(),
      });
    };
    peer.ontrack = event => {
      const [stream] = event.streams;
      if (stream) options.onRemoteStream?.(userId, stream);
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected")
        options.onPeerState?.(userId, "connected");
      if (["failed", "disconnected", "closed"].includes(peer.connectionState)) {
        options.onPeerState?.(userId, "disconnected");
        options.onPeerQuality?.(userId, { level: "unavailable" });
      }
    };
    return peer;
  };

  const createOffer = async (userId: number) => {
    const peer = ensurePeer(userId);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    if (peer.localDescription)
      send({
        type: "voice.offer",
        channelId: options.channelId,
        roomKey: options.roomKey,
        targetUserId: userId,
        sdp: {
          type: peer.localDescription.type,
          sdp: peer.localDescription.sdp,
        },
      });
  };

  const handleEvent = async (event: VoiceSignalEvent) => {
    if (closed) return;
    if (event.type === "voice.members") {
      const members = Array.isArray(event.payload?.members)
        ? event.payload.members
        : [];
      await Promise.all(
        members
          .filter(
            (member: { userId?: number }) =>
              member.userId && member.userId !== options.localUserId
          )
          .map((member: { userId: number }) => createOffer(member.userId))
      );
      return;
    }
    if (event.type === "voice.peer.left") {
      const userId = Number(event.payload?.userId);
      const peer = peers.get(userId);
      peer?.close();
      stopPeerStats(userId);
      options.onPeerQuality?.(userId, { level: "unavailable" });
      peers.delete(userId);
      return;
    }
    if (event.type === "voice.peer.joined") return;
    const userId = Number(event.payload?.fromUserId);
    if (!userId) return;
    const peer = ensurePeer(userId);
    if (event.type === "voice.offer") {
      await peer.setRemoteDescription(
        event.payload.sdp as RTCSessionDescriptionInit
      );
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      if (peer.localDescription)
        send({
          type: "voice.answer",
          channelId: options.channelId,
          roomKey: options.roomKey,
          targetUserId: userId,
          sdp: {
            type: peer.localDescription.type,
            sdp: peer.localDescription.sdp,
          },
        });
    } else if (event.type === "voice.answer") {
      await peer.setRemoteDescription(
        event.payload.sdp as RTCSessionDescriptionInit
      );
    } else if (event.type === "voice.ice" && event.payload.candidate) {
      await peer.addIceCandidate(
        event.payload.candidate as RTCIceCandidateInit
      );
    }
  };

  return {
    setLocalStream(stream: MediaStream | null) {
      localStream = stream;
      peers.forEach(attachLocalTracks);
      if (stream && peers.size > 0)
        void Promise.all(
          Array.from(peers.keys()).map(userId => createOffer(userId))
        );
    },
    async renegotiateAll() {
      await Promise.all(
        Array.from(peers.keys()).map(userId => createOffer(userId))
      );
    },
    handleEvent,
    close() {
      closed = true;
      peers.forEach(peer => peer.close());
      statsTimers.forEach(timer => clearInterval(timer));
      statsTimers.clear();
      peers.clear();
      localStream?.getTracks().forEach(track => track.stop());
      localStream = null;
    },
    setTrackEnabled(kind: "audio" | "video", enabled: boolean) {
      localStream
        ?.getTracks()
        .filter(track => track.kind === kind)
        .forEach(track => {
          track.enabled = enabled;
        });
    },
    async replaceTrack(
      kind: "audio" | "video",
      track: MediaStreamTrack | null
    ) {
      localStream
        ?.getTracks()
        .filter(
          currentTrack => currentTrack.kind === kind && currentTrack !== track
        )
        .forEach(currentTrack => {
          currentTrack.enabled = false;
        });
      await Promise.all(
        Array.from(peers.values()).map(async peer => {
          const sender = peer
            .getSenders()
            .find(candidate => candidate.track?.kind === kind);
          if (sender) await sender.replaceTrack(track);
          else if (track && localStream) peer.addTrack(track, localStream);
        })
      );
      await Promise.all(
        Array.from(peers.keys()).map(userId => createOffer(userId))
      );
    },
    getPeerIds() {
      return Array.from(peers.keys());
    },
  };
}
