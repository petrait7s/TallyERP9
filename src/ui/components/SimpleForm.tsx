import { useEffect, useRef, useState } from 'react';

export interface SField { key: string; label: string; type: 'text' | 'yesno'; hint?: string }

/** Small keyboard form: Enter next (accepts on last), Ctrl+A accept, Esc quit, Y/N/Space on yes/no. */
export function SimpleForm(props: {
  title: string; fields: SField[]; initial: Record<string, string>;
  onAccept: (v: Record<string, string>) => string | null | Promise<string | null>; onCancel: () => void;
}) {
  const [vals, setVals] = useState(props.initial);
  const [idx, setIdx] = useState(0);
  const [err, setErr] = useState('');
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { refs.current[idx]?.focus(); refs.current[idx]?.select(); }, [idx]);

  const accept = async () => {
    const e = await props.onAccept(vals);
    setErr(e ?? '');
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const f = props.fields[idx];
    const k = e.key;
    if (k === 'Escape' || (e.ctrlKey && k.toLowerCase() === 'q')) { e.preventDefault(); e.stopPropagation(); props.onCancel(); return; }
    if (e.ctrlKey && k.toLowerCase() === 'a') { e.preventDefault(); void accept(); return; }
    if (e.ctrlKey || e.altKey) return;
    if (f.type === 'yesno' && ['y', 'Y', 'n', 'N', ' '].includes(k)) {
      e.preventDefault();
      setVals((v) => ({ ...v, [f.key]: k === ' ' ? (v[f.key] === 'Yes' ? 'No' : 'Yes') : k.toLowerCase() === 'y' ? 'Yes' : 'No' }));
      return;
    }
    if (k === 'ArrowUp') { e.preventDefault(); setIdx(Math.max(0, idx - 1)); }
    else if (k === 'Enter') { e.preventDefault(); if (idx === props.fields.length - 1) void accept(); else setIdx(idx + 1); }
  };

  return (
    <div className="panel form-panel" onKeyDown={onKeyDown}>
      <div className="panel-title">{props.title}</div>
      <div className="form-body">
        {props.fields.map((f, i) => (
          <label key={f.key} className={i === idx ? 'frow active' : 'frow'}>
            <span className="flabel">{f.label}</span><span>:</span>
            <input ref={(el) => { refs.current[i] = el; }} value={vals[f.key] ?? ''} placeholder={f.hint} readOnly={f.type === 'yesno'}
              onFocus={() => setIdx(i)} onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))} />
          </label>
        ))}
      </div>
      {err ? <div className="form-msg err">{err}</div> : null}
      <div className="typed">Enter: next &nbsp; Ctrl+A: accept &nbsp; Esc: quit</div>
    </div>
  );
}
