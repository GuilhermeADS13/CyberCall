import { describe, expect, it, vi } from "vitest";
import { createWebRtcMesh, getMediaConstraints } from "./webrtc";

class FakePeerConnection {
  static instances: FakePeerConnection[] = [];
  localDescription: { type: string; sdp: string } | null = null;
  remoteDescriptions: RTCSessionDescriptionInit[] = [];
  candidates: RTCIceCandidateInit[] = [];
  connectionState = "new";
  onicecandidate: ((event: { candidate: { toJSON: () => RTCIceCandidateInit } | null }) => void) | null = null;
  ontrack: ((event: { streams: MediaStream[] }) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  constructor() { FakePeerConnection.instances.push(this); }
  getSenders() { return []; }
  addTrack() { return {}; }
  async createOffer() { return { type: "offer", sdp: "offer-sdp" }; }
  async createAnswer() { return { type: "answer", sdp: "answer-sdp" }; }
  async setLocalDescription(description: { type: string; sdp: string }) { this.localDescription = description; }
  async setRemoteDescription(description: RTCSessionDescriptionInit) { this.remoteDescriptions.push(description); }
  async addIceCandidate(candidate: RTCIceCandidateInit) { this.candidates.push(candidate); }
  close() { this.connectionState = "closed"; }
}

describe("WebRTC mesh signaling", () => {
  it("returns explicit media constraints", () => {
    expect(getMediaConstraints(true, false)).toEqual({ audio: true, video: false });
    expect(getMediaConstraints(false, true)).toEqual({ audio: false, video: true });
    expect(getMediaConstraints(true, true, { audioDeviceId: "mic-1", videoDeviceId: "cam-2" })).toEqual({ audio: { deviceId: { exact: "mic-1" } }, video: { deviceId: { exact: "cam-2" } } });
  });

  it("creates offers for existing members and handles answer/ICE events", async () => {
    const previous = (globalThis as typeof globalThis & { RTCPeerConnection?: unknown }).RTCPeerConnection;
    Object.assign(globalThis, { RTCPeerConnection: FakePeerConnection });
    FakePeerConnection.instances = [];
    const commands: any[] = [];
    try {
      const mesh = createWebRtcMesh({ channelId: 12, roomKey: "lobby", localUserId: 7, sendSignal: (command) => commands.push(command) });
      await mesh.handleEvent({ type: "voice.members", payload: { members: [{ userId: 8, name: "Pilot 8" }] } });
      expect(commands[0]).toEqual({ type: "voice.offer", channelId: 12, roomKey: "lobby", targetUserId: 8, sdp: { type: "offer", sdp: "offer-sdp" } });
      await mesh.handleEvent({ type: "voice.answer", payload: { fromUserId: 8, sdp: { type: "answer", sdp: "answer-sdp" } } });
      await mesh.handleEvent({ type: "voice.ice", payload: { fromUserId: 8, candidate: { candidate: "candidate:1" } } });
      expect(FakePeerConnection.instances[0].remoteDescriptions).toHaveLength(1);
      expect(FakePeerConnection.instances[0].candidates).toEqual([{ candidate: "candidate:1" }]);
      mesh.close();
      expect(FakePeerConnection.instances[0].connectionState).toBe("closed");
    } finally {
      vi.restoreAllMocks();
      if (previous === undefined) delete (globalThis as typeof globalThis & { RTCPeerConnection?: unknown }).RTCPeerConnection; else (globalThis as typeof globalThis & { RTCPeerConnection?: unknown }).RTCPeerConnection = previous;
    }
  });
});
