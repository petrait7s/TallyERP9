/** Central key handling: normalised key names + a stack-based router. */
export interface KeyLike {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

export function normalizeKey(e: KeyLike): string {
  let k = e.key;
  if (k === 'Escape') k = 'Esc';
  else if (k === ' ') k = 'Space';
  else if (k.length === 1) k = k.toUpperCase();
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(k)) return '';
  const mods = [e.ctrlKey ? 'Ctrl' : '', e.altKey ? 'Alt' : '', e.shiftKey && k.length > 1 ? 'Shift' : '']
    .filter(Boolean);
  return [...mods, k].join('+');
}

export interface ButtonDef {
  /** normalised key, e.g. "F4", "Ctrl+F8" */
  key: string;
  label: string;
  disabled?: boolean;
  action?: () => void;
}

export interface KeyHandler {
  id: string;
  /** return true if handled */
  onKey(key: string, raw?: KeyLike): boolean;
  buttons?(): ButtonDef[];
}

export class KeyRouter {
  private stack: KeyHandler[] = [];

  push(h: KeyHandler): void { this.stack.push(h); }
  pop(): KeyHandler | undefined { return this.stack.pop(); }
  top(): KeyHandler | undefined { return this.stack[this.stack.length - 1]; }
  get depth(): number { return this.stack.length; }
  clear(): void { this.stack = []; }

  /** Top handler gets first chance; its enabled buttons with a matching key also fire. */
  dispatch(raw: KeyLike): boolean {
    const key = normalizeKey(raw);
    if (!key) return false;
    const h = this.top();
    if (!h) return false;
    if (h.onKey(key, raw)) return true;
    const b = h.buttons?.().find((x) => x.key === key && !x.disabled && x.action);
    if (b) {
      b.action!();
      return true;
    }
    return false;
  }
}
