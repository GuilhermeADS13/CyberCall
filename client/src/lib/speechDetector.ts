import { normalizeAudioLevel, type MicrophoneMeter } from "./microphoneMeter";

export type SpeechDetector = MicrophoneMeter;

export type SpeechDetectorOptions = {
  threshold?: number;
  releaseThreshold?: number;
};

export function createSpeechDetector(
  stream: MediaStream,
  onSpeaking: (speaking: boolean, level: number) => void,
  runtime: typeof globalThis = globalThis,
  options: SpeechDetectorOptions = {}
): SpeechDetector {
  const AudioContextCtor =
    (
      runtime as typeof globalThis & {
        AudioContext?: new () => any;
        webkitAudioContext?: new () => any;
      }
    ).AudioContext ||
    (runtime as typeof globalThis & { webkitAudioContext?: new () => any })
      .webkitAudioContext;
  if (!AudioContextCtor) return { supported: false, close: () => undefined };

  const context = new AudioContextCtor();
  const analyser = context.createAnalyser();
  analyser.fftSize = 256;
  const source = context.createMediaStreamSource(stream);
  source.connect(analyser);
  const samples = new Uint8Array(analyser.fftSize);
  const threshold = Math.max(0, Math.min(1, options.threshold ?? 0.075));
  const releaseThreshold = Math.max(
    0,
    Math.min(threshold, options.releaseThreshold ?? threshold * 0.65)
  );
  let speaking = false;
  let closed = false;
  let frame: number | ReturnType<typeof setTimeout> | undefined;
  const schedule = (callback: () => void) => {
    const raf = (
      runtime as typeof globalThis & {
        requestAnimationFrame?: (cb: FrameRequestCallback) => number;
      }
    ).requestAnimationFrame;
    return raf ? raf(() => callback()) : setTimeout(callback, 1000 / 30);
  };
  const cancel = (handle: number | ReturnType<typeof setTimeout>) => {
    const caf = (
      runtime as typeof globalThis & {
        cancelAnimationFrame?: (id: number) => void;
      }
    ).cancelAnimationFrame;
    if (caf && typeof handle === "number") caf(handle);
    else clearTimeout(handle);
  };
  const tick = () => {
    if (closed) return;
    analyser.getByteTimeDomainData(samples);
    const level = normalizeAudioLevel(samples);
    const nextSpeaking = speaking
      ? level >= releaseThreshold
      : level >= threshold;
    if (nextSpeaking !== speaking) {
      speaking = nextSpeaking;
      onSpeaking(speaking, level);
    } else if (speaking) {
      onSpeaking(true, level);
    }
    frame = schedule(tick);
  };
  void context.resume?.().catch(() => undefined);
  tick();

  return {
    supported: true,
    close: () => {
      closed = true;
      if (frame !== undefined) cancel(frame);
      source.disconnect?.();
      analyser.disconnect?.();
      void context.close?.().catch(() => undefined);
      if (speaking) onSpeaking(false, 0);
    },
  };
}
