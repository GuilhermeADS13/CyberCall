import { describe, expect, it, vi } from "vitest";
import { createSpeechDetector } from "./speechDetector";

describe("speech detector", () => {
  it("remains silent below the threshold and enters speaking above it", () => {
    const source = { connect: vi.fn(), disconnect: vi.fn() };
    let sample = 180;
    const analyser = {
      fftSize: 0,
      getByteTimeDomainData: (data: Uint8Array) => data.fill(sample),
      disconnect: vi.fn(),
    };
    const runtime = {
      AudioContext: class {
        createAnalyser() {
          return analyser;
        }
        createMediaStreamSource() {
          return source;
        }
        resume() {
          return Promise.resolve();
        }
        close() {
          return Promise.resolve();
        }
      },
    } as unknown as typeof globalThis;
    const changes: boolean[] = [];
    const detector = createSpeechDetector(
      {} as MediaStream,
      speaking => changes.push(speaking),
      runtime,
      { threshold: 0.05, releaseThreshold: 0.03 }
    );
    expect(changes).toEqual([true]);
    detector.close();
    expect(changes).toEqual([true, false]);
    expect(source.disconnect).toHaveBeenCalled();
    expect(analyser.disconnect).toHaveBeenCalled();
  });

  it("reports unsupported runtimes without throwing", () => {
    const detector = createSpeechDetector(
      {} as MediaStream,
      vi.fn(),
      {} as typeof globalThis
    );
    expect(detector.supported).toBe(false);
    expect(() => detector.close()).not.toThrow();
  });
});
