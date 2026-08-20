export type MicrophoneMeter = {
  supported: boolean;
  close: () => void;
};

export function normalizeAudioLevel(samples: Uint8Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const centered = (samples[index] - 128) / 128;
    sum += centered * centered;
  }
  return Math.min(1, Math.sqrt(sum / samples.length) * 2.5);
}

type AudioContextLike = {
  createMediaStreamSource: (stream: MediaStream) => { connect: (node: unknown) => void; disconnect?: () => void };
  createAnalyser: () => { fftSize: number; getByteTimeDomainData: (data: Uint8Array) => void; connect?: (node: unknown) => void; disconnect?: () => void };
  close?: () => Promise<void>;
  resume?: () => Promise<void>;
};

type MeterWindow = typeof globalThis & {
  AudioContext?: new () => AudioContextLike;
  webkitAudioContext?: new () => AudioContextLike;
};

export function createMicrophoneMeter(stream: MediaStream, onLevel: (level: number) => void, runtime: MeterWindow = globalThis as MeterWindow): MicrophoneMeter {
  const AudioContextCtor = runtime.AudioContext || runtime.webkitAudioContext;
  if (!AudioContextCtor) return { supported: false, close: () => undefined };

  const context = new AudioContextCtor();
  const analyser = context.createAnalyser();
  analyser.fftSize = 256;
  const source = context.createMediaStreamSource(stream);
  source.connect(analyser);
  const samples = new Uint8Array(analyser.fftSize);
  let closed = false;
  let frame: number | ReturnType<typeof setTimeout> | undefined;
  const schedule = (callback: () => void) => {
    const raf = (runtime as typeof globalThis & { requestAnimationFrame?: (cb: FrameRequestCallback) => number }).requestAnimationFrame;
    if (raf) return raf(() => callback());
    return setTimeout(callback, 1000 / 30);
  };
  const cancel = (handle: number | ReturnType<typeof setTimeout>) => {
    const caf = (runtime as typeof globalThis & { cancelAnimationFrame?: (id: number) => void }).cancelAnimationFrame;
    if (caf && typeof handle === "number") caf(handle); else clearTimeout(handle);
  };
  const tick = () => {
    if (closed) return;
    analyser.getByteTimeDomainData(samples);
    onLevel(normalizeAudioLevel(samples));
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
      onLevel(0);
    },
  };
}
