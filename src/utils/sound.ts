// High-Performance Zero-Latency Audio Synthesizer & Buffer Playback Engine
// Pre-renders audio impulses to PCM AudioBuffers to eliminate all runtime oscillator node scheduling latency.

let audioCtx: AudioContext | null = null;
const bufferCache: Map<string, AudioBuffer> = new Map();
let isAudioPrewarmed = false;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass({ latencyHint: 'interactive' });
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch {
    // Ignore audio initialization errors
  }
  return audioCtx;
}

// Generate pre-computed PCM buffers for instantaneous playback without oscillator build-up delay
function createSynthesizedBuffer(
  ctx: AudioContext,
  type: 'click' | 'equals' | 'clear' | 'error',
  profile: 'mechanical' | 'soft' | 'beep' | 'tap'
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  let duration = 0.035; // Default short duration in seconds
  if (type === 'equals') duration = 0.075;
  if (type === 'clear') duration = 0.055;
  if (type === 'error') duration = 0.095;

  const totalFrames = Math.floor(sampleRate * duration);
  const audioBuffer = ctx.createBuffer(1, totalFrames, sampleRate);
  const data = audioBuffer.getChannelData(0);

  for (let i = 0; i < totalFrames; i++) {
    const t = i / sampleRate;
    let sample = 0;

    if (profile === 'beep') {
      let freq = 880; // A5
      let envelope = Math.exp(-t * 90);
      if (type === 'equals') {
        freq = 1046.5; // C6
        envelope = Math.exp(-t * 45);
      } else if (type === 'clear') {
        freq = 587.33; // D5
        envelope = Math.exp(-t * 60);
      } else if (type === 'error') {
        freq = 220;
        envelope = Math.exp(-t * 35);
        sample = (2 * ((t * freq) % 1) - 1) * envelope;
      }
      if (type !== 'error') {
        sample = Math.sin(2 * Math.PI * freq * t) * envelope;
      }
    } else if (profile === 'soft') {
      let startFreq = 420;
      let endFreq = 160;
      let decay = 110;
      if (type === 'equals') {
        startFreq = 440;
        endFreq = 660;
        decay = 50;
      } else if (type === 'clear') {
        startFreq = 320;
        endFreq = 140;
        decay = 80;
      } else if (type === 'error') {
        startFreq = 180;
        endFreq = 100;
        decay = 40;
      }
      const currentFreq = startFreq + (endFreq - startFreq) * (t / duration);
      const envelope = Math.exp(-t * decay);
      sample = Math.sin(2 * Math.PI * currentFreq * t) * envelope;
    } else if (profile === 'tap') {
      let startFreq = 1400;
      let endFreq = 120;
      let decay = 190;
      if (type === 'equals') {
        startFreq = 900;
        endFreq = 1350;
        decay = 75;
      } else if (type === 'clear') {
        startFreq = 500;
        endFreq = 100;
        decay = 130;
      }
      const currentFreq = startFreq + (endFreq - startFreq) * (t / duration);
      const envelope = Math.exp(-t * decay);
      const phase = (t * currentFreq) % 1;
      const triangle = 2 * Math.abs(2 * phase - 1) - 1;
      sample = triangle * envelope;
    } else {
      // Default: 'mechanical' (dual key click transient + tactile body thud)
      if (type === 'click') {
        // High click transient
        const clickFreq = 1800 - 1500 * (t / 0.018);
        const clickEnv = Math.exp(-t * 220);
        const click = Math.sin(2 * Math.PI * Math.max(200, clickFreq) * t) * clickEnv;

        // Bottom-out thud
        const thudFreq = 140 - 80 * (t / 0.028);
        const thudEnv = Math.exp(-t * 110);
        const thud = Math.sin(2 * Math.PI * Math.max(50, thudFreq) * t) * thudEnv;

        sample = click * 0.75 + thud * 0.45;
      } else if (type === 'equals') {
        const freq = 523.25 + (783.99 - 523.25) * (t / duration);
        const env = Math.exp(-t * 45);
        sample = Math.sin(2 * Math.PI * freq * t) * env;
      } else if (type === 'clear') {
        const freq = 600 - 420 * (t / duration);
        const env = Math.exp(-t * 70);
        sample = Math.sin(2 * Math.PI * Math.max(120, freq) * t) * env;
      } else {
        const freq = 200 - 100 * (t / duration);
        const env = Math.exp(-t * 35);
        sample = (2 * ((t * freq) % 1) - 1) * env;
      }
    }

    // Soft anti-clipping limiter
    data[i] = Math.max(-0.95, Math.min(0.95, sample));
  }

  return audioBuffer;
}

// Pre-render and cache all sound variants for instantaneous zero-latency replay
export function prewarmAudio() {
  if (isAudioPrewarmed) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const types: Array<'click' | 'equals' | 'clear' | 'error'> = [
    'click',
    'equals',
    'clear',
    'error',
  ];
  const profiles: Array<'mechanical' | 'soft' | 'beep' | 'tap'> = [
    'mechanical',
    'soft',
    'beep',
    'tap',
  ];

  for (const p of profiles) {
    for (const t of types) {
      const key = `${p}_${t}`;
      if (!bufferCache.has(key)) {
        bufferCache.set(key, createSynthesizedBuffer(ctx, t, p));
      }
    }
  }
  isAudioPrewarmed = true;
}

export function playClickSound(
  type: 'click' | 'equals' | 'clear' | 'error' = 'click',
  volume: number = 0.5,
  profile: 'mechanical' | 'soft' | 'beep' | 'tap' = 'mechanical'
) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Immediately trigger resume if suspended (e.g. initial touch/click unlock)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const key = `${profile}_${type}`;
    let buffer = bufferCache.get(key);
    if (!buffer) {
      buffer = createSynthesizedBuffer(ctx, type, profile);
      bufferCache.set(key, buffer);
    }

    // Direct buffer source playback - instantaneous hardware DAC dispatch with 0ms construction delay
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    const volScale = Math.max(0.01, Math.min(1.0, volume));
    gainNode.gain.setValueAtTime(volScale * 0.8, ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);
  } catch {
    // Ignore audio playback context errors
  }
}
