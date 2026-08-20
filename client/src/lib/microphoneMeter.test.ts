import { describe, expect, it, vi } from "vitest";
import {
  createMicrophoneMeter,
  normalizeAudioLevel,
  normalizeMicrophoneSensitivity,
} from "./microphoneMeter";

describe("microphone meter", () => {
  it("clamps and rounds sensitivity to the safe range", () => {
    expect(normalizeMicrophoneSensitivity(25)).toBe(50);
    expect(normalizeMicrophoneSensitivity(137.4)).toBe(137);
    expect(normalizeMicrophoneSensitivity(240)).toBe(200);
    expect(normalizeMicrophoneSensitivity(Number.NaN)).toBe(100);
  });

  it("normalizes silence and a signal into the 0..1 range", () => {
    expect(normalizeAudioLevel(new Uint8Array([128, 128, 128]))).toBe(0);
    expect(normalizeAudioLevel(new Uint8Array([0, 255, 0, 255]))).toBe(1);
    expect(normalizeAudioLevel(new Uint8Array())).toBe(0);
  });

  it("reports unsupported runtimes without throwing", () => {
    const meter = createMicrophoneMeter(
      {} as MediaStream,
      vi.fn(),
      {} as typeof globalThis
    );
    expect(meter.supported).toBe(false);
    expect(() => meter.close()).not.toThrow();
  });

  it("connects an analyser, emits a level and closes resources", async () => {
    const closeContext = vi.fn(async () => undefined);
    const disconnectSource = vi.fn();
    const disconnectAnalyser = vi.fn();
    const analyser = {
      fftSize: 0,
      getByteTimeDomainData: (samples: Uint8Array) => samples.fill(160),
      disconnect: disconnectAnalyser,
    };
    const runtime = {
      AudioContext: class {
        createAnalyser() {
          return analyser;
        }
        createMediaStreamSource() {
          return { connect: vi.fn(), disconnect: disconnectSource };
        }
        resume() {
          return Promise.resolve();
        }
        close = closeContext;
      },
    } as unknown as typeof globalThis;
    const levels: number[] = [];
    const meter = createMicrophoneMeter(
      {} as MediaStream,
      level => levels.push(level),
      runtime
    );
    expect(meter.supported).toBe(true);
    expect(levels[0]).toBeGreaterThan(0);
    meter.close();
    await Promise.resolve();
    expect(disconnectSource).toHaveBeenCalled();
    expect(disconnectAnalyser).toHaveBeenCalled();
    expect(closeContext).toHaveBeenCalled();
  });
});
