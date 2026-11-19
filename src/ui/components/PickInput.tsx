import { useEffect, useState } from 'react';

interface Props {
  value: string;
  options: string[];
  active: boolean;
  readOnly?: boolean;
  placeholder?: string;
  onPick: (v: string) => void;
  onFocus?: () => void;
  inputRef?: (el: HTMLInputElement | null) => void;
  className?: string;
  /** mirrors the typed query so the parent can seed Alt+C creation */
  queryRef?: { current: string };
}

/** Query-driven list field: type to filter, Up/Down to move, Enter picks. Other keys bubble to the parent. */
export function PickInput(p: Props) {
  const [query, setQuery] = useState('');
  const [hi, setHi] = useState(0);
  useEffect(() => { if (!p.active) { setQuery(''); setHi(0); } }, [p.active]);
  if (p.queryRef && p.active) p.queryRef.current = query;
  const q = query.toLowerCase();
  const opts = q ? [...p.options.filter((o) => o.toLowerCase().startsWith(q)), ...p.options.filter((o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q))] : p.options;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (p.readOnly || e.ctrlKey || e.altKey) return;
    const stop = () => { e.preventDefault(); e.stopPropagation(); };
    if (e.key === 'Enter') {
      if (opts.length) { stop(); const v = opts[Math.min(hi, opts.length - 1)]; setQuery(''); p.onPick(v); }
      else if (!query && p.value) { stop(); p.onPick(p.value); }
      else stop();
    } else if (e.key === 'ArrowDown') { stop(); setHi((h) => Math.min(opts.length - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { stop(); setHi((h) => Math.max(0, h - 1)); }
    else if (e.key === 'Backspace' && query) { stop(); setQuery((x) => x.slice(0, -1)); setHi(0); }
    else if (e.key.length === 1) { stop(); setQuery((x) => x + e.key); setHi(0); }
  };

  return (
    <span className="pick-wrap">
      <input
        ref={p.inputRef}
        className={p.className}
        value={p.active && !p.readOnly ? query : p.value}
        placeholder={p.active ? p.value || p.placeholder : p.placeholder}
        readOnly
        onFocus={p.onFocus}
        onKeyDown={onKeyDown}
      />
      {p.active && !p.readOnly ? (
        <div className="pick-drop panel">
          <ul className="menu-list">
            {opts.map((o, i) => (
              <li key={o + i} className={i === hi ? 'menu-item selected' : 'menu-item'} onMouseDown={(e) => { e.preventDefault(); setQuery(''); p.onPick(o); }}>{o}</li>
            ))}
            {!opts.length ? <li className="menu-item">End of List</li> : null}
          </ul>
        </div>
      ) : null}
    </span>
  );
}
