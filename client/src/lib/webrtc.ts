export type VoiceSignalEvent = {
  type: "voice.members" | "voice.peer.joined" | "voice.peer.left" | "voice.offer" | "voice.answer" | "voice.ice";
  payload: any;
};

export type WebRtcMeshOptions = {
  channelId: number;
  roomKey: string;
  localUserId: number;
  sendSignal: (command: any) => void;
  onRemoteStream?: (userId: number, stream: MediaStream) => void;
  onPeerState?: (userId: number, state: "connecting" | "connected" | "disconnected") => void;
  rtcConfiguration?: RTCConfiguration;
};

export const defaultRtcConfiguration: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function getMediaConstraints(audio: boolean, video: boolean): MediaStreamConstraints {
  return { audio, video };
}

export function createWebRtcMesh(options: WebRtcMeshOptions) {
  const peers = new Map<number, RTCPeerConnection>();
  let localStream: MediaStream | null = null;
  let closed = false;

  const send = (command: unknown) => {
    if (!closed) options.sendSignal(command);
  };

  const attachLocalTracks = (peer: RTCPeerConnection) => {
    localStream?.getTracks().forEach((track) => {
      if (!peer.getSenders().some((sender) => sender.track?.id === track.id)) peer.addTrack(track, localStream as MediaStream);
    });
  };

  const ensurePeer = (userId: number) => {
    const existing = peers.get(userId);
    if (existing) return existing;
    const peer = new RTCPeerConnection(options.rtcConfiguration || defaultRtcConfiguration);
    peers.set(userId, peer);
    attachLocalTracks(peer);
    options.onPeerState?.(userId, "connecting");
    peer.onicecandidate = (event) => {
      if (!event.candidate) return;
      send({ type: "voice.ice", channelId: options.channelId, roomKey: options.roomKey, targetUserId: userId, candidate: event.candidate.toJSON() });
    };
    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) options.onRemoteStream?.(userId, stream);
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") options.onPeerState?.(userId, "connected");
      if (["failed", "disconnected", "closed"].includes(peer.connectionState)) options.onPeerState?.(userId, "disconnected");
    };
    return peer;
  };

  const createOffer = async (userId: number) => {
    const peer = ensurePeer(userId);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    if (peer.localDescription) send({ type: "voice.offer", channelId: options.channelId, roomKey: options.roomKey, targetUserId: userId, sdp: { type: peer.localDescription.type, sdp: peer.localDescription.sdp } });
  };

  const handleEvent = async (event: VoiceSignalEvent) => {
    if (closed) return;
    if (event.type === "voice.members") {
      const members = Array.isArray(event.payload?.members) ? event.payload.members : [];
      await Promise.all(members.filter((member: { userId?: number }) => member.userId && member.userId !== options.localUserId).map((member: { userId: number }) => createOffer(member.userId)));
      return;
    }
    if (event.type === "voice.peer.left") {
      const userId = Number(event.payload?.userId);
      const peer = peers.get(userId);
      peer?.close();
      peers.delete(userId);
      return;
    }
    if (event.type === "voice.peer.joined") return;
    const userId = Number(event.payload?.fromUserId);
    if (!userId) return;
    const peer = ensurePeer(userId);
    if (event.type === "voice.offer") {
      await peer.setRemoteDescription(event.payload.sdp as RTCSessionDescriptionInit);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      if (peer.localDescription) send({ type: "voice.answer", channelId: options.channelId, roomKey: options.roomKey, targetUserId: userId, sdp: { type: peer.localDescription.type, sdp: peer.localDescription.sdp } });
    } else if (event.type === "voice.answer") {
      await peer.setRemoteDescription(event.payload.sdp as RTCSessionDescriptionInit);
    } else if (event.type === "voice.ice" && event.payload.candidate) {
      await peer.addIceCandidate(event.payload.candidate as RTCIceCandidateInit);
    }
  };

  return {
    setLocalStream(stream: MediaStream | null) {
      localStream = stream;
      peers.forEach(attachLocalTracks);
      if (stream && peers.size > 0) void Promise.all(Array.from(peers.keys()).map((userId) => createOffer(userId)));
    },
    async renegotiateAll() {
      await Promise.all(Array.from(peers.keys()).map((userId) => createOffer(userId)));
    },
    handleEvent,
    close() {
      closed = true;
      peers.forEach((peer) => peer.close());
      peers.clear();
      localStream?.getTracks().forEach((track) => track.stop());
      localStream = null;
    },
    setTrackEnabled(kind: "audio" | "video", enabled: boolean) {
      localStream?.getTracks().filter((track) => track.kind === kind).forEach((track) => { track.enabled = enabled; });
    },
    getPeerIds() {
      return Array.from(peers.keys());
    },
  };
}
