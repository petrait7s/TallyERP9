import { useEffect, useRef, useState } from 'react';

export interface ToggleItem { key: string; label: string; value: boolean }

/** F11 / F12 style Yes/No list. Up/Down move, Y/N/Space set, Enter next (accepts on last), Ctrl+A accept, Esc cancel. */
export function ToggleDialog(props: { title: string; items: ToggleItem[]; onAccept: (v: Record<string, boolean>) => void; onCancel: () => void }) {
  const [vals, setVals] = useState(() => Object.fromEntries(props.items.map((i) => [i.key, i.value])));
  const [idx, setIdx] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.focus(); }, []);
  const key = props.items[idx].key;

  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    const k = e.key;
    const stop = () => e.preventDefault();
    if (k === 'Escape') { stop(); props.onCancel(); }
    else if (e.ctrlKey && k.toLowerCase() === 'a') { stop(); props.onAccept(vals); }
    else if (k === 'ArrowDown') { stop(); setIdx((i) => Math.min(props.items.length - 1, i + 1)); }
    else if (k === 'ArrowUp') { stop(); setIdx((i) => Math.max(0, i - 1)); }
    else if (k === 'y' || k === 'Y') { stop(); setVals((v) => ({ ...v, [key]: true })); setIdx((i) => Math.min(props.items.length - 1, i + 1)); }
    else if (k === 'n' || k === 'N') { stop(); setVals((v) => ({ ...v, [key]: false })); setIdx((i) => Math.min(props.items.length - 1, i + 1)); }
    else if (k === ' ') { stop(); setVals((v) => ({ ...v, [key]: !v[key] })); }
    else if (k === 'Enter') { stop(); if (idx === props.items.length - 1) props.onAccept(vals); else setIdx(idx + 1); }
  };

  return (
    <div className="modal-back">
      <div className="panel toggle-panel" ref={box} tabIndex={-1} onKeyDown={onKeyDown}>
        <div className="panel-title">{props.title}</div>
        <ul className="menu-list">
          {props.items.map((it, i) => (
            <li key={it.key} className={i === idx ? 'menu-item selected toggle-row' : 'menu-item toggle-row'} onClick={() => setIdx(i)}
              onDoubleClick={() => setVals((v) => ({ ...v, [it.key]: !v[it.key] }))}>
              <span>{it.label}</span><b>{vals[it.key] ? 'Yes' : 'No'}</b>
            </li>
          ))}
        </ul>
        <div className="typed">Y/N or Space: set &nbsp; Ctrl+A: accept &nbsp; Esc: cancel</div>
      </div>
    </div>
  );
}
