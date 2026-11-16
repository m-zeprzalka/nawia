// One input source for keyboard and gamepad.
//
// Feel notes:
//  - the most recently pressed direction wins on each axis (no "dead" input when rolling keys),
//  - actions are timestamped, so the game can honour a press that came a few frames early.

export type Dir = 'down' | 'up' | 'left' | 'right';
export type Action = 'shift' | 'attack' | 'shield' | 'dodge' | 'mute' | 'fullscreen' | 'lang' | 'pause';

const DIR_KEYS: Record<string, Dir> = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

const ACTION_KEYS: Record<string, Action> = {
  ShiftLeft: 'shift', ShiftRight: 'shift', Space: 'shift',
  KeyZ: 'attack', KeyJ: 'attack', Enter: 'attack',
  KeyX: 'shield', KeyK: 'shield',
  KeyC: 'dodge', KeyI: 'dodge', AltLeft: 'dodge',
  KeyM: 'mute', KeyF: 'fullscreen', KeyL: 'lang', Escape: 'pause', KeyP: 'pause',
};

// Standard gamepad mapping.
const PAD_ACTIONS: Record<number, Action> = {
  0: 'attack', // A
  2: 'dodge', // X
  1: 'shield', 5: 'shield', 7: 'shield', // B / right bumper / right trigger
  3: 'shift', 4: 'shift', 6: 'shift', // Y / left bumper / left trigger
  9: 'pause',
};
const PAD_DEADZONE = 0.28;

class InputManager {
  /** Movement vector, length <= 1. */
  moveX = 0;
  moveY = 0;
  /** Direction the player most recently asked for (null when idle). */
  wantDir: Dir | null = null;
  /** True for one update after any key/button went down. Used by menus. */
  anyPressed = false;
  /** Last device used, for prompts. */
  device: 'keyboard' | 'gamepad' = 'keyboard';

  private readonly held: Dir[] = []; // press order, most recent last
  private readonly actionKeys = new Set<string>(); // action keys currently down
  private readonly padDown = new Set<Action>();
  private readonly pressedAt: Partial<Record<Action, number>> = {};
  private readonly padPrev: boolean[] = [];
  private anyQueued = false;
  private now = 0;
  private attached = false;

  attach(): void {
    if (this.attached) return;
    this.attached = true;
    window.addEventListener('keydown', (e) => {
      const dir = DIR_KEYS[e.code];
      const action = ACTION_KEYS[e.code];
      if (dir || action || e.code === 'Tab') e.preventDefault();
      if (e.repeat) return;
      this.device = 'keyboard';
      this.anyQueued = true;
      if (dir) {
        this.keysDown.add(e.code);
        const i = this.held.indexOf(dir);
        if (i >= 0) this.held.splice(i, 1);
        this.held.push(dir);
      }
      if (action) {
        this.pressedAt[action] = this.now;
        this.actionKeys.add(e.code);
      }
    });
    window.addEventListener('keyup', (e) => {
      this.actionKeys.delete(e.code);
      const dir = DIR_KEYS[e.code];
      if (!dir) return;
      // two keys can map to one direction (W and ArrowUp): only release when both are up
      this.keysDown.delete(e.code);
      if (![...this.keysDown].some((c) => DIR_KEYS[c] === dir)) {
        const i = this.held.indexOf(dir);
        if (i >= 0) this.held.splice(i, 1);
      }
    });
    window.addEventListener('blur', () => { this.held.length = 0; this.keysDown.clear(); this.actionKeys.clear(); });
  }

  private readonly keysDown = new Set<string>();

  /** Call once per frame, before reading anything. `now` in seconds. */
  update(now: number): void {
    this.now = now;
    this.anyPressed = this.anyQueued;
    this.anyQueued = false;

    // keyboard: latest key wins per axis
    let x = 0;
    let y = 0;
    for (const d of this.held) {
      if (d === 'left') x = -1;
      else if (d === 'right') x = 1;
      else if (d === 'up') y = -1;
      else y = 1;
    }
    let want: Dir | null = this.held.length ? this.held[this.held.length - 1] : null;

    // gamepad
    const pad = this.firstPad();
    this.padDown.clear();
    if (pad) {
      let px = Math.abs(pad.axes[0] ?? 0) > PAD_DEADZONE ? pad.axes[0] : 0;
      let py = Math.abs(pad.axes[1] ?? 0) > PAD_DEADZONE ? pad.axes[1] : 0;
      if (pad.buttons[14]?.pressed) px = -1;
      if (pad.buttons[15]?.pressed) px = 1;
      if (pad.buttons[12]?.pressed) py = -1;
      if (pad.buttons[13]?.pressed) py = 1;
      if (px !== 0 || py !== 0) {
        x = px;
        y = py;
        this.device = 'gamepad';
        want = Math.abs(px) > Math.abs(py) ? (px < 0 ? 'left' : 'right') : py < 0 ? 'up' : 'down';
      }
      pad.buttons.forEach((b, i) => {
        const was = this.padPrev[i] ?? false;
        if (b.pressed && !was) {
          this.anyPressed = true;
          this.device = 'gamepad';
          const action = PAD_ACTIONS[i];
          if (action) this.pressedAt[action] = now;
        }
        this.padPrev[i] = b.pressed;
        if (b.pressed && PAD_ACTIONS[i]) this.padDown.add(PAD_ACTIONS[i]);
      });
    }

    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    this.moveX = x;
    this.moveY = y;
    this.wantDir = want;
  }

  /**
   * True if `action` was pressed within the last `buffer` seconds. Consumes the press.
   * (Presses are stamped between frames, so the buffer must cover at least one frame.)
   */
  consume(action: Action, buffer = 0.15): boolean {
    const t = this.pressedAt[action];
    if (t === undefined || this.now - t > buffer + 1e-4) return false;
    delete this.pressedAt[action];
    return true;
  }

  /** Is the action's key or button held right now? (for the shield) */
  isDown(action: Action): boolean {
    if (this.padDown.has(action)) return true;
    for (const code of this.actionKeys) if (ACTION_KEYS[code] === action) return true;
    return false;
  }

  /** Forget everything buffered (use when changing scenes/states). */
  flush(): void {
    for (const k of Object.keys(this.pressedAt)) delete this.pressedAt[k as Action];
    this.anyQueued = false;
    this.anyPressed = false;
  }

  private firstPad(): Gamepad | null {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;
    for (const p of navigator.getGamepads()) if (p && p.connected) return p;
    return null;
  }
}

export const input = new InputManager();
