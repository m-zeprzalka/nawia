// Conversations: a tiny script format a writer can type by hand, and the machine that runs it.
// The format is described for writers in docs/DIALOGS.md. Pure logic: no Phaser, no DOM.
//
//   # zielarka                      a node (a named piece of conversation)
//   @ Zielarka | Herbalist          who speaks the lines that follow
//   Wstałeś wreszcie. | Up at last. a line (Polish | English)
//   [+poznana]                      remember something ([-poznana] forgets it)
//   -> zielarka.znowu if poznana    go to another node (optionally only if / unless something is remembered)
//   ? Idę. | I am going. -> end     an answer the player can pick; "end" closes the conversation

export interface Bilingual {
  pl: string;
  en: string;
}

export type Op =
  | { op: 'say'; who: Bilingual | null; text: Bilingual }
  | { op: 'set'; flag: string; on: boolean }
  | { op: 'jump'; to: string; flag: string | null; unless: boolean }
  | { op: 'choice'; text: Bilingual; to: string };

/** node id -> what happens in it, in order */
export type Dialogs = Map<string, Op[]>;

export const END = 'end';

function bilingual(v: string): Bilingual {
  const [pl, en] = v.split('|').map((s) => s.trim());
  return { pl, en: en || pl };
}

/** Parses one .dialog.txt file into `into` (several files share one namespace of node ids). */
export function parseDialogs(text: string, file = '?', into: Dialogs = new Map()): Dialogs {
  const fail = (n: number, msg: string): never => {
    throw new Error(`Dialog file "${file}", line ${n + 1}: ${msg}`);
  };
  let ops: Op[] | null = null;
  let who: Bilingual | null = null;
  text.replace(/\r/g, '').split('\n').forEach((raw, n) => {
    const line = raw.trim();
    if (line === '' || line.startsWith('//')) return;
    if (line.startsWith('#')) {
      const id = line.slice(1).trim();
      if (!/^[\w.-]+$/.test(id)) fail(n, `bad node name "${id}" (letters, digits, dot, dash, underscore)`);
      if (id === END) fail(n, `"${END}" is reserved: it closes the conversation`);
      if (into.has(id)) fail(n, `node "${id}" is defined twice`);
      ops = [];
      who = null;
      into.set(id, ops);
      return;
    }
    if (!ops) return fail(n, 'text before the first "# node"');
    if (line.startsWith('@')) {
      const name = line.slice(1).trim();
      who = name ? bilingual(name) : null;
      return;
    }
    const flag = /^\[([+-])([\w.-]+)\]$/.exec(line);
    if (flag) {
      ops.push({ op: 'set', flag: flag[2], on: flag[1] === '+' });
      return;
    }
    if (line.startsWith('?')) {
      const m = /^\?\s*(.+?)\s*->\s*([\w.-]+)$/.exec(line);
      if (!m) return fail(n, 'an answer looks like "? text | text -> node"');
      ops.push({ op: 'choice', text: bilingual(m[1]), to: m[2] });
      return;
    }
    if (line.startsWith('->')) {
      const m = /^->\s*([\w.-]+)(?:\s+(if|unless)\s+([\w.-]+))?$/.exec(line);
      if (!m) return fail(n, 'a jump looks like "-> node", "-> node if flag" or "-> node unless flag"');
      ops.push({ op: 'jump', to: m[1], flag: m[3] ?? null, unless: m[2] === 'unless' });
      return;
    }
    ops.push({ op: 'say', who, text: bilingual(line) });
  });
  return into;
}

/** Design-time check: every jump and answer leads to a node that exists. */
export function checkDialogs(dialogs: Dialogs): string[] {
  const problems: string[] = [];
  for (const [id, ops] of dialogs)
    for (const op of ops)
      if ((op.op === 'jump' || op.op === 'choice') && op.to !== END && !dialogs.has(op.to))
        problems.push(`dialog "${id}" leads to "${op.to}", which does not exist`);
  return problems;
}

/** One conversation in progress. Read `line` and `choices`, call `next()` or `choose(i)`, stop when `done`. */
export class Talk {
  /** What is being said right now (stays up while answers are offered). */
  line: { who: Bilingual | null; text: Bilingual } | null = null;
  /** The answers on offer, if the conversation is waiting for one. */
  choices: { text: Bilingual; to: string }[] | null = null;
  done = false;

  private readonly dialogs: Dialogs;
  private readonly flags: Set<string>;
  private ops: Op[] = [];
  private i = 0;

  constructor(dialogs: Dialogs, flags: Set<string>, start: string) {
    this.dialogs = dialogs;
    this.flags = flags;
    this.goto(start);
    this.run();
  }

  /** The current line has been read. */
  next(): void {
    if (!this.choices) this.run();
  }

  choose(index: number): void {
    const c = this.choices?.[index];
    if (!c) return;
    this.choices = null;
    this.goto(c.to);
    this.run();
  }

  private goto(id: string): void {
    this.ops = id === END ? [] : (this.dialogs.get(id) ?? []);
    this.i = 0;
  }

  private run(): void {
    // a script that jumps in circles without ever saying anything must not hang the game
    for (let guard = 0; guard < 500 && this.i < this.ops.length; guard++) {
      const op = this.ops[this.i];
      if (op.op === 'say') {
        this.i++;
        this.line = { who: op.who, text: op.text };
        return;
      }
      if (op.op === 'set') {
        if (op.on) this.flags.add(op.flag);
        else this.flags.delete(op.flag);
        this.i++;
      } else if (op.op === 'jump') {
        const ok = op.flag === null || this.flags.has(op.flag) !== op.unless;
        if (ok) this.goto(op.to);
        else this.i++;
      } else {
        const list: { text: Bilingual; to: string }[] = [];
        for (let k = this.i; k < this.ops.length; k++) {
          const c = this.ops[k];
          if (c.op !== 'choice') break;
          list.push({ text: c.text, to: c.to });
        }
        this.choices = list;
        return;
      }
    }
    this.done = true;
  }
}
