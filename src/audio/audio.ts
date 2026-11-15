// All sound is synthesized with WebAudio at runtime: no audio files to ship or license.
// One drone runs under both worlds; each world adds its own layer, and the shift crossfades them.

import type { World } from '../config.ts';

export type Sfx =
  | 'shiftNawia' | 'shiftJawia' | 'denied' | 'swing' | 'hit' | 'clink' | 'enemyDie' | 'hurt'
  | 'door' | 'text' | 'gate' | 'bell' | 'start' | 'die' | 'block' | 'smash' | 'pickup' | 'reject';

// A minor pentatonic, the scale of the whole game (the bell is an A).
const SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private echo!: GainNode; // send into the feedback delay
  private layer!: Record<World, GainNode>;
  private world: World = 'jawia';
  private muted = false;
  private timer: number | null = null;
  private nextNote = 0;
  private lastText = 0;

  get isMuted(): boolean {
    return this.muted;
  }

  /** Must be called from a user gesture (key press) at least once. Safe to call repeatedly. */
  unlock(): void {
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.build();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  /** Tab hidden: stop the drone. Tab back: carry on. */
  setSuspended(suspended: boolean): void {
    if (!this.ctx) return;
    if (suspended) void this.ctx.suspend();
    else void this.ctx.resume();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, this.ctx.currentTime, 0.03);
    return this.muted;
  }

  private build(): void {
    const ctx = this.ctx!;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.ratio.value = 8;
    this.master.connect(limiter).connect(ctx.destination);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.8;
    this.sfxBus.connect(this.master);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0;
    this.musicBus.connect(this.master);

    // a dark feedback delay: the "cave"
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.31;
    const fb = ctx.createGain();
    fb.gain.value = 0.42;
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 1700;
    this.echo = ctx.createGain();
    this.echo.gain.value = 1;
    this.echo.connect(delay);
    delay.connect(damp).connect(fb).connect(delay);
    damp.connect(this.master);

    this.layer = { jawia: ctx.createGain(), nawia: ctx.createGain() };
    this.layer.jawia.gain.value = 1;
    this.layer.nawia.gain.value = 0;
    this.layer.jawia.connect(this.musicBus);
    this.layer.nawia.connect(this.musicBus);
  }

  // ------------------------------------------------------------- ambience

  startAmbience(): void {
    const ctx = this.ctx;
    if (!ctx || this.timer !== null) return;
    const t = ctx.currentTime;

    // shared drone: two slightly detuned low saws through a slow, breathing low-pass
    const droneLp = ctx.createBiquadFilter();
    droneLp.type = 'lowpass';
    droneLp.frequency.value = 190;
    droneLp.Q.value = 3;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.16;
    for (const f of [55, 55.35, 82.6]) {
      const o = ctx.createOscillator();
      o.type = f > 80 ? 'triangle' : 'sawtooth';
      o.frequency.value = f;
      o.connect(droneLp);
      o.start(t);
    }
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 60;
    lfo.connect(lfoGain).connect(droneLp.frequency);
    lfo.start(t);
    droneLp.connect(droneGain).connect(this.musicBus);

    // Jawia: damp air, a far-off wind
    const wind = this.noiseLoop();
    const windLp = ctx.createBiquadFilter();
    windLp.type = 'bandpass';
    windLp.frequency.value = 420;
    windLp.Q.value = 0.6;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.05;
    const windLfo = ctx.createOscillator();
    windLfo.frequency.value = 0.11;
    const windLfoGain = ctx.createGain();
    windLfoGain.gain.value = 0.03;
    windLfo.connect(windLfoGain).connect(windGain.gain);
    windLfo.start(t);
    wind.connect(windLp).connect(windGain).connect(this.layer.jawia);

    // Nawia: a thin choir of sines that never quite agree
    const choirGain = ctx.createGain();
    choirGain.gain.value = 0.05;
    for (const [f, det] of [[440, 0.4], [659.25, -0.6], [329.63, 0.25], [987.77, 0.8]] as const) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f + det;
      const vib = ctx.createOscillator();
      vib.frequency.value = 0.13 + Math.random() * 0.2;
      const vibGain = ctx.createGain();
      vibGain.gain.value = 1.6;
      vib.connect(vibGain).connect(o.frequency);
      const g = ctx.createGain();
      g.gain.value = f > 900 ? 0.25 : 0.6;
      o.connect(g).connect(choirGain);
      o.start(t);
      vib.start(t);
    }
    choirGain.connect(this.layer.nawia);
    choirGain.connect(this.echo);

    this.musicBus.gain.setTargetAtTime(0.55, t, 1.5);
    this.nextNote = t + 1.5;
    this.timer = window.setInterval(() => this.schedule(), 200);
  }

  /** Sparse plucked notes: drips in Jawia, glassy echoes in Nawia. */
  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    while (this.nextNote < ctx.currentTime + 0.4) {
      const nawia = this.world === 'nawia';
      const f = SCALE[Math.floor(Math.random() * SCALE.length)] * (nawia ? 2 : 1);
      this.pluck(f, this.nextNote, nawia ? 0.05 : 0.07, nawia ? 1.6 : 0.7, nawia);
      if (Math.random() < 0.3) this.pluck(f * 1.5, this.nextNote + 0.16, 0.035, nawia ? 1.4 : 0.6, nawia);
      this.nextNote += nawia ? 1.4 + Math.random() * 2.6 : 2.2 + Math.random() * 4;
    }
  }

  private pluck(freq: number, at: number, gain: number, decay: number, glassy: boolean): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = glassy ? 'sine' : 'triangle';
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain, at + (glassy ? 0.06 : 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    o.connect(g);
    g.connect(this.musicBus);
    g.connect(this.echo);
    o.start(at);
    o.stop(at + decay + 0.05);
  }

  setWorld(world: World): void {
    this.world = world;
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    this.layer.jawia.gain.setTargetAtTime(world === 'jawia' ? 1 : 0, t, 0.12);
    this.layer.nawia.gain.setTargetAtTime(world === 'nawia' ? 1 : 0, t, 0.12);
  }

  // ------------------------------------------------------------- building blocks

  private noiseBuffer: AudioBuffer | null = null;

  private noise(): AudioBufferSourceNode {
    const ctx = this.ctx!;
    if (!this.noiseBuffer) {
      const len = ctx.sampleRate * 2;
      this.noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    return src;
  }

  private noiseLoop(): AudioBufferSourceNode {
    const src = this.noise();
    src.loop = true;
    src.start();
    return src;
  }

  /** An oscillator with a pitch sweep and a percussive envelope. */
  private tone(
    type: OscillatorType, f0: number, f1: number, dur: number, gain: number,
    opts: { at?: number; attack?: number; echo?: number; dest?: AudioNode } = {},
  ): void {
    const ctx = this.ctx!;
    const at = ctx.currentTime + (opts.at ?? 0);
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, at);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(gain, at + (opts.attack ?? 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g);
    g.connect(opts.dest ?? this.sfxBus);
    if (opts.echo) {
      const send = ctx.createGain();
      send.gain.value = opts.echo;
      g.connect(send).connect(this.echo);
    }
    o.start(at);
    o.stop(at + dur + 0.05);
  }

  /** Filtered noise burst with a sweeping band. */
  private hiss(
    type: BiquadFilterType, f0: number, f1: number, dur: number, gain: number,
    opts: { at?: number; attack?: number; q?: number; echo?: number } = {},
  ): void {
    const ctx = this.ctx!;
    const at = ctx.currentTime + (opts.at ?? 0);
    const src = this.noise();
    const filt = ctx.createBiquadFilter();
    filt.type = type;
    filt.Q.value = opts.q ?? 1;
    filt.frequency.setValueAtTime(f0, at);
    filt.frequency.exponentialRampToValueAtTime(Math.max(20, f1), at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(gain, at + (opts.attack ?? 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(filt).connect(g);
    g.connect(this.sfxBus);
    if (opts.echo) {
      const send = ctx.createGain();
      send.gain.value = opts.echo;
      g.connect(send).connect(this.echo);
    }
    src.start(at, Math.random());
    src.stop(at + dur + 0.05);
  }

  // ------------------------------------------------------------- sound effects

  sfx(name: Sfx): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    switch (name) {
      case 'shiftNawia':
        // the world drops away: a falling whoosh and a cold chord opening above it
        this.hiss('bandpass', 2600, 240, 0.42, 0.5, { q: 1.4, echo: 0.4 });
        this.tone('sine', 520, 110, 0.36, 0.5);
        this.tone('sine', 880, 880, 0.9, 0.12, { attack: 0.03, echo: 0.8 });
        this.tone('sine', 1318.5, 1318.5, 1.1, 0.09, { attack: 0.05, echo: 0.8, at: 0.03 });
        this.tone('triangle', 55, 40, 0.3, 0.6);
        break;
      case 'shiftJawia':
        // and comes back: a rising breath, a warm low thump
        this.hiss('bandpass', 260, 2200, 0.34, 0.45, { q: 1.4, echo: 0.3 });
        this.tone('sine', 130, 440, 0.26, 0.45);
        this.tone('triangle', 440, 440, 0.5, 0.14, { attack: 0.02, echo: 0.5 });
        this.tone('triangle', 659.25, 659.25, 0.6, 0.08, { attack: 0.03, echo: 0.5, at: 0.02 });
        this.tone('sine', 70, 48, 0.22, 0.7);
        break;
      case 'denied':
        this.tone('square', 110, 96, 0.09, 0.22);
        this.tone('square', 92, 78, 0.12, 0.22, { at: 0.09 });
        this.hiss('lowpass', 500, 200, 0.12, 0.25);
        break;
      case 'swing':
        this.hiss('bandpass', 900, 3800, 0.11, 0.42, { q: 1.2 });
        break;
      case 'hit':
        this.hiss('lowpass', 2400, 300, 0.12, 0.6);
        this.tone('square', 210, 70, 0.1, 0.32);
        break;
      case 'clink':
        this.tone('triangle', 1900, 1500, 0.07, 0.2, { echo: 0.4 });
        this.tone('sine', 2850, 2700, 0.1, 0.1, { echo: 0.4 });
        break;
      case 'enemyDie':
        this.tone('triangle', 420, 50, 0.34, 0.4, { echo: 0.5 });
        this.hiss('bandpass', 1800, 200, 0.4, 0.35, { echo: 0.5 });
        break;
      case 'hurt':
        this.tone('sawtooth', 260, 90, 0.2, 0.3);
        this.hiss('lowpass', 1400, 200, 0.16, 0.45);
        break;
      case 'door':
        this.hiss('lowpass', 300, 900, 0.5, 0.22, { attack: 0.2 });
        this.tone('sine', 62, 50, 0.3, 0.35);
        break;
      case 'text': {
        if (ctx.currentTime - this.lastText < 0.045) break;
        this.lastText = ctx.currentTime;
        this.tone('sine', 1040 + Math.random() * 180, 980, 0.03, 0.05);
        break;
      }
      case 'gate':
        for (let i = 0; i < 7; i++) this.tone('square', 140 - i * 8, 90, 0.05, 0.16, { at: i * 0.07 });
        this.hiss('lowpass', 220, 90, 0.7, 0.5, { attack: 0.05 });
        this.tone('triangle', 440, 440, 0.8, 0.1, { at: 0.5, echo: 0.8 });
        this.tone('triangle', 659.25, 659.25, 0.9, 0.08, { at: 0.62, echo: 0.8 });
        break;
      case 'start':
        this.tone('triangle', 220, 220, 0.5, 0.14, { echo: 0.7 });
        this.tone('triangle', 329.63, 329.63, 0.6, 0.12, { at: 0.12, echo: 0.7 });
        this.tone('triangle', 440, 440, 0.9, 0.12, { at: 0.24, echo: 0.7 });
        break;
      case 'die':
        this.tone('sawtooth', 220, 40, 0.9, 0.3, { echo: 0.5 });
        this.hiss('lowpass', 900, 80, 1.0, 0.4);
        break;
      case 'block':
        // wood and iron taking a blow
        this.tone('square', 320, 180, 0.07, 0.3);
        this.hiss('bandpass', 1500, 600, 0.09, 0.5, { q: 2 });
        this.tone('triangle', 1250, 1100, 0.12, 0.12, { echo: 0.3 });
        break;
      case 'smash':
        this.hiss('highpass', 1800, 900, 0.16, 0.5);
        this.hiss('bandpass', 700, 300, 0.2, 0.4, { at: 0.03 });
        this.tone('triangle', 900, 300, 0.08, 0.18);
        break;
      case 'pickup':
        this.tone('triangle', 659.25, 659.25, 0.12, 0.16, { echo: 0.4 });
        this.tone('triangle', 880, 880, 0.2, 0.16, { at: 0.08, echo: 0.5 });
        break;
      case 'reject':
        // the border slamming shut: a crack, a falling groan, a low thud
        this.hiss('highpass', 3000, 900, 0.1, 0.5);
        this.tone('sawtooth', 300, 55, 0.45, 0.4, { echo: 0.4 });
        this.tone('square', 98, 70, 0.3, 0.3, { at: 0.04 });
        this.tone('sine', 60, 36, 0.4, 0.8, { at: 0.02 });
        break;
      case 'bell': {
        // a struck bell: inharmonic partials, long tail
        const f = 220;
        const partials: [number, number, number][] = [
          [0.5, 0.5, 4.5], [1, 0.6, 3.6], [1.19, 0.35, 2.8], [1.56, 0.22, 2.2],
          [2, 0.3, 2.0], [2.51, 0.16, 1.5], [2.66, 0.12, 1.3], [3.01, 0.1, 1.0], [4.1, 0.06, 0.7],
        ];
        for (const [ratio, gain, dur] of partials) this.tone('sine', f * ratio, f * ratio * 0.997, dur, gain * 0.5, { attack: 0.002, echo: 0.5 });
        this.hiss('bandpass', 3200, 900, 0.09, 0.4, { q: 0.8 });
        break;
      }
    }
  }
}

export const audio = new AudioEngine();
