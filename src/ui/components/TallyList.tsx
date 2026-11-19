import { useEffect, useState } from 'react';

export interface ListItem { label: string; heading?: boolean }

/** Keyboard list: Up/Down/Home/End/PgUp/PgDn, Enter selects, type-ahead jump. Skips headings. */
export function useListNav(items: ListItem[], onEnter: (i: number) => void) {
  const first = Math.max(0, items.findIndex((x) => !x.heading));
  const [sel, setSel] = useState(first);
  const [typed, setTyped] = useState('');
  useEffect(() => setSel(first), [first, items.length]);

  const selectable = items.map((x, i) => (x.heading ? -1 : i)).filter((i) => i >= 0);
  const move = (d: number) => {
    const pos = selectable.indexOf(sel);
    setSel(selectable[Math.min(selectable.length - 1, Math.max(0, pos + d))]);
  };

  const onKey = (key: string): boolean => {
    switch (key) {
      case 'ArrowDown': move(1); return true;
      case 'ArrowUp': move(-1); return true;
      case 'PageDown': move(8); return true;
      case 'PageUp': move(-8); return true;
      case 'Home': setSel(selectable[0]); return true;
      case 'End': setSel(selectable[selectable.length - 1]); return true;
      case 'Enter': onEnter(sel); return true;
      case 'Backspace': setTyped((t) => t.slice(0, -1)); return true;
    }
    if (key.length === 1) {
      const t = (typed + key).toLowerCase();
      setTyped(t);
      const hit = selectable.find((i) => items[i].label.toLowerCase().replace(/^[^:]*:\s*/, '').startsWith(t));
      if (hit !== undefined) setSel(hit);
      return true;
    }
    return false;
  };
  return { sel, setSel, typed, onKey };
}

export function TallyList(props: { title: string; items: ListItem[]; sel: number; typed?: string; onPick?: (i: number) => void; wide?: boolean }) {
  return (
    <div className={props.wide ? "panel menu-panel wide" : "panel menu-panel"}>
      <div className="panel-title">{props.title}</div>
      <ul className="menu-list">
        {props.items.map((it, i) => (
          <li
            key={i}
            className={it.heading ? 'menu-heading' : i === props.sel ? 'menu-item selected' : 'menu-item'}
            onClick={() => !it.heading && props.onPick?.(i)}
          >
            {it.label}
          </li>
        ))}
      </ul>
      {props.typed ? <div className="typed">Search: {props.typed}</div> : null}
    </div>
  );
}
