// All sound is synthesized with WebAudio at runtime: no audio files to ship or license.
//
// Underground, one drone runs under both worlds; each world adds its own layer, and the shift crossfades them.
// Under the open sky and indoors nothing sounds continuously: no drone, no wind, no choir. Jawia has one short
// tune there (the village dance), which plays through and then rests; Nawia has only sparse glassy notes.
// Where the blight is thick the tune stops, and what is left is silence.
//
// Every continuous source goes through `cave`, and so does its way into the echo: when a place turns `cave`
// down, nothing is left ringing. (The choir used to feed the echo directly and could be heard everywhere.)

import type { World } from '../config.ts';
import type { Biome } from '../world/roomFormat.ts';

export type Sfx =
  | 'shiftNawia' | 'shiftJawia' | 'denied' | 'swing' | 'hit' | 'clink' | 'enemyDie' | 'hurt'
  | 'door' | 'text' | 'gate' | 'bell' | 'start' | 'die' | 'block' | 'smash' | 'pickup' | 'reject'
  | 'shoot' | 'switch' | 'crash' | 'roar' | 'rise' | 'greatbell' | 'cluck';

// ------------------------------------------------------------- the tune
// Two lines of notes on a grid of equal steps: "a4" plays, "-" holds the note before it, "." is silence,
// "|" is only there for the eye. "fs5" is F sharp. Both lines must have the same number of steps.

interface Tune {
  /** seconds per step */
  step: number;
  /** silent steps after the last note, before it starts again: a piper takes a breath */
  rest: number;
  lead: string;
  bass: string;
}

// The village: a dance in D, with the raised fourth (G sharp) of highland fiddles in its second half.
const VILLAGE: Tune = {
  step: 0.2,
  rest: 40,
  lead:
    'a4 d5 fs5 a5 | g5 fs5 e5 d5 | e5 fs5 g5 e5 | fs5 - d5 - | a4 d5 fs5 a5 | b5 a5 g5 fs5 | e5 g5 fs5 e5 | d5 - - . |' +
    'e5 a5 a5 gs5 | a5 b5 cs6 a5 | b5 a5 gs5 fs5 | e5 - a5 - | fs5 a5 d6 a5 | b5 a5 g5 fs5 | e5 a4 cs5 e5 | d5 - - . |',
  bass:
    'd3 . a3 . | g3 . d3 . | a2 . e3 . | d3 . a3 . | d3 . a3 . | g2 . d3 . | a2 . e3 . | d3 . d3 . |' +
    'a2 . e3 . | a2 . e3 . | e3 . b2 . | a2 . e3 . | d3 . a3 . | g2 . d3 . | a2 . e3 . | d3 . d3 . |',
};

const SEMITONE: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

/** One line of a tune as a list of steps: [frequency, length in steps], or null where nothing starts. */
function parseLine(line: string): ([number, number] | null)[] {
  const out: ([number, number] | null)[] = [];
  let last: [number, number] | null = null;
  for (const tok of line.split(/[\s|]+/)) {
    if (!tok) continue;
    if (tok === '-') {
      if (last) last[1]++;
      out.push(null);
      continue;
    }
    if (tok === '.') {
      last = null;
      out.push(null);
      continue;
    }
    const m = /^([a-g])(s?)(\d)$/.exec(tok);
    if (!m) throw new Error(`bad note "${tok}"`);
    const midi = 12 * (Number(m[3]) + 1) + SEMITONE[m[1]] + (m[2] ? 1 : 0);
    last = [440 * Math.pow(2, (midi - 69) / 12), 1];
    out.push(last);
  }
  return out;
}

const LEAD = parseLine(VILLAGE.lead);
const BASS = parseLine(VILLAGE.bass);

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
  /** Everything continuous (drone, wind, choir) goes through here, so a place can turn it off. */
  private cave!: GainNode;
  /** Drips and glassy notes: single sounds, not a hum, so they have a level of their own. */
  private drips!: GainNode;
  /** The choir's way into the echo: open underground (it is the ring of the stronghold), shut everywhere else. */
  private choirSend!: GainNode;
  /** The tune of the surface. */
  private song!: GainNode;
  private biome: Biome = 'crypt';
  private blight = 0;
  private songStep = 0;
  private songNext = 0;
  /** dev: measures what is left of the background (see `levels`) */
  private meters: { ambient: AnalyserNode; all: AnalyserNode } | null = null;

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

    this.cave = ctx.createGain();
    this.cave.connect(this.musicBus);
    this.drips = ctx.createGain();
    this.drips.connect(this.musicBus);
    this.song = ctx.createGain();
    this.song.gain.value = 0;
    // square waves through a gentle low-pass: a wooden pipe rather than a buzzer
    const soft = ctx.createBiquadFilter();
    soft.type = 'lowpass';
    soft.frequency.value = 2200;
    this.song.connect(soft).connect(this.musicBus);

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
    this.layer.jawia.connect(this.cave);
    this.layer.nawia.connect(this.cave);
    // the background reaches the echo only through gains a place can close: silence stays silent
    this.choirSend = ctx.createGain();
    this.choirSend.connect(this.echo);
    this.drips.connect(this.echo);

    if (import.meta.env.DEV) {
      const ambient = ctx.createAnalyser();
      const all = ctx.createAnalyser();
      ambient.fftSize = all.fftSize = 2048;
      this.cave.connect(ambient);
      this.drips.connect(ambient);
      damp.connect(ambient);
      this.master.connect(all);
      this.meters = { ambient, all };
    }
  }

  /** dev: loudness right now, in dB (RMS over ~40 ms). `ambient` is the background and its echo, without the tune and effects. */
  levels(): { ambient: number; all: number } | null {
    if (!this.meters) return null;
    const rms = (a: AnalyserNode): number => {
      const d = new Float32Array(a.fftSize);
      a.getFloatTimeDomainData(d);
      let sum = 0;
      for (const v of d) sum += v * v;
      return Math.round(10 * Math.log10(sum / d.length + 1e-12));
    };
    return { ambient: rms(this.meters.ambient), all: rms(this.meters.all) };
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
    droneLp.connect(droneGain).connect(this.cave);

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
    choirGain.connect(this.choirSend);

    this.musicBus.gain.setTargetAtTime(0.55, t, 1.5);
    this.nextNote = t + 1.5;
    this.timer = window.setInterval(() => this.schedule(), 200);
  }

  /** Whether the tune of the surface plays here: under the open sky or a roof, in Jawia, away from the thick of the blight. */
  private get tuneOn(): boolean {
    return this.biome !== 'crypt' && this.world === 'jawia' && this.blight < 2;
  }

  /** The tune, a few steps ahead of the clock; and sparse plucked notes: drips in Jawia, glassy echoes in Nawia. */
  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    if (this.tuneOn) {
      if (this.songNext < ctx.currentTime - 0.5) this.songNext = ctx.currentTime + 0.05; // the tab was asleep
      const steps = LEAD.length + VILLAGE.rest;
      while (this.songNext < ctx.currentTime + 0.4) {
        const lead = LEAD[this.songStep];
        const bass = BASS[this.songStep];
        if (lead) this.voice('square', lead[0], this.songNext, lead[1] * VILLAGE.step, 0.042);
        if (bass) this.voice('triangle', bass[0], this.songNext, bass[1] * VILLAGE.step, 0.09);
        this.songStep = (this.songStep + 1) % steps;
        this.songNext += VILLAGE.step;
      }
    }
    // drips and glassy echoes belong underground and to Nawia
    const underground = this.biome === 'crypt' || this.world === 'nawia';
    while (this.nextNote < ctx.currentTime + 0.4) {
      if (!underground) {
        this.nextNote = ctx.currentTime + 1;
        break;
      }
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
    g.connect(this.drips);
    o.start(at);
    o.stop(at + decay + 0.05);
  }

  /** One note of the tune: a soft attack, held, let go. */
  private voice(type: OscillatorType, freq: number, at: number, dur: number, gain: number): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = ctx.createGain();
    const end = at + dur * 0.92;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain, at + 0.012);
    g.gain.setTargetAtTime(gain * 0.6, at + 0.03, 0.08);
    g.gain.setTargetAtTime(0, end, 0.03);
    o.connect(g).connect(this.song);
    o.start(at);
    o.stop(end + 0.25);
  }

  setWorld(world: World): void {
    const was = this.world;
    this.world = world;
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    this.layer.jawia.gain.setTargetAtTime(world === 'jawia' ? 1 : 0, t, 0.12);
    this.layer.nawia.gain.setTargetAtTime(world === 'nawia' ? 1 : 0, t, 0.12);
    // coming back from Nawia, the tune picks up from its beginning
    if (world === 'jawia' && was !== 'jawia' && this.tuneOn) this.restartTune();
    this.mix();
  }

  /** Where the hero is: the stronghold has its drone; the surface has its tune, until the blight gets thick. */
  setPlace(biome: Biome, blight = 0): void {
    const was = this.tuneOn;
    this.biome = biome;
    this.blight = blight;
    if (this.tuneOn && !was) this.restartTune();
    this.mix();
  }

  private restartTune(): void {
    this.songStep = 0;
    this.songNext = (this.ctx?.currentTime ?? 0) + 0.4;
  }

  private mix(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const crypt = this.biome === 'crypt';
    // nothing hums outside the stronghold, on either side
    this.cave.gain.setTargetAtTime(crypt ? 1 : 0, t, 0.25);
    this.choirSend.gain.setTargetAtTime(crypt ? 1 : 0, t, 0.25);
    this.drips.gain.setTargetAtTime(crypt ? 1 : this.world === 'nawia' ? 0.7 : 0, t, 0.25);
    this.song.gain.setTargetAtTime(this.tuneOn ? 1 : 0, t, this.tuneOn ? 0.4 : 0.12);
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
      case 'cluck':
        this.tone('square', 920, 520, 0.05, 0.06);
        this.tone('square', 760, 430, 0.06, 0.05, { at: 0.08 });
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
      case 'shoot':
        // a wisp spitting fire
        this.tone('sine', 700, 1500, 0.12, 0.2, { echo: 0.3 });
        this.hiss('bandpass', 1200, 3000, 0.1, 0.2, { q: 2 });
        break;
      case 'switch':
        // the turning stone: a deep click and two notes trading places
        this.tone('square', 150, 90, 0.07, 0.3);
        this.tone('triangle', 523.25, 523.25, 0.3, 0.16, { echo: 0.6 });
        this.tone('triangle', 783.99, 783.99, 0.45, 0.14, { at: 0.09, echo: 0.6 });
        this.hiss('lowpass', 400, 120, 0.3, 0.35, { at: 0.02 });
        break;
      case 'crash':
        // a ton of stone meeting a wall
        this.tone('sine', 90, 30, 0.5, 0.9);
        this.hiss('lowpass', 1800, 120, 0.5, 0.8);
        this.hiss('highpass', 2500, 1200, 0.12, 0.3, { at: 0.02 });
        break;
      case 'roar':
        this.tone('sawtooth', 70, 110, 0.5, 0.35, { attack: 0.08, echo: 0.5 });
        this.tone('sawtooth', 105, 60, 0.7, 0.3, { at: 0.25, echo: 0.5 });
        this.hiss('lowpass', 300, 700, 0.8, 0.35, { attack: 0.2 });
        break;
      case 'rise':
        // the second soul getting up on the other side
        this.tone('sine', 180, 720, 0.5, 0.25, { attack: 0.1, echo: 0.7 });
        this.tone('sine', 271, 1080, 0.5, 0.14, { attack: 0.1, at: 0.05, echo: 0.7 });
        this.hiss('bandpass', 500, 2600, 0.45, 0.2, { q: 3, echo: 0.5 });
        break;
      case 'greatbell': {
        // the great bell: an octave under its little brother, and it does not stop
        const f = 110;
        const partials: [number, number, number][] = [
          [0.5, 0.6, 7], [1, 0.7, 6], [1.19, 0.4, 5], [1.56, 0.25, 4],
          [2, 0.32, 3.6], [2.51, 0.18, 2.8], [2.66, 0.14, 2.4], [3.01, 0.12, 2], [4.1, 0.07, 1.4],
        ];
        for (const [ratio, gain, dur] of partials) this.tone('sine', f * ratio, f * ratio * 0.997, dur, gain * 0.55, { attack: 0.003, echo: 0.6 });
        this.hiss('bandpass', 2400, 600, 0.14, 0.5, { q: 0.8 });
        this.tone('sine', 55, 40, 1.2, 0.8);
        break;
      }
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
if (import.meta.env.DEV) (window as unknown as { __audio: AudioEngine }).__audio = audio;
