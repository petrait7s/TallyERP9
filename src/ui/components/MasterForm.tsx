import { useEffect, useRef, useState } from 'react';
import { alterMaster, createMaster, deleteMaster, type MasterKind } from '../../engine';
import { DEFS, type Draft, type FieldDef } from '../screens/masterDefs';
import { useApp } from '../store';

export type FormMode = 'create' | 'alter' | 'display';

interface Props {
  kind: MasterKind;
  mode: FormMode;
  /** existing master name (alter/display) */
  name?: string;
  initial?: Partial<Draft>;
  /** called when the form finishes; name set when something was created/altered */
  onDone: (name?: string) => void;
  /** nested (Alt+C) forms close after the first successful create */
  once?: boolean;
}

export function MasterForm({ kind, mode, name, initial, onDone, once }: Props) {
  const def = DEFS[kind];
  const company = useApp((s) => s.company);
  const mutate = useApp((s) => s.mutate);
  const setExtra = useApp((s) => s.setExtraButtons);
  const setHint = useApp((s) => s.setHint);

  const start = (): Draft => ({ ...(mode === 'create' ? def.blank(company) : def.toDraft(company, name!)), ...initial } as Draft);
  const [draft, setDraft] = useState<Draft>(start);
  const [idx, setIdx] = useState(0);
  const [query, setQuery] = useState('');
  const [hi, setHi] = useState(0);
  const [error, setError] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const [nested, setNested] = useState<{ field: string; kind: MasterKind; name: string } | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const feat = (f: FieldDef) => !f.feature || company.features[f.feature];
  const visible = def.fields.filter((f) => feat(f) && (!f.visible || f.visible(draft)));
  const cur = visible[Math.min(idx, visible.length - 1)];
  const readOnly = mode === 'display';

  const options = (f: FieldDef): string[] => {
    const all = f.options?.(company, draft) ?? [];
    const q = query.toLowerCase();
    return q ? all.filter((o) => o.toLowerCase().includes(q)) : all;
  };

  useEffect(() => { if (!nested) inputs.current[idx]?.focus(); }, [idx, nested]);

  const set = (k: string, v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const go = (i: number) => { setIdx(Math.max(0, Math.min(visible.length - 1, i))); setQuery(''); setHi(0); setError(''); };

  const accept = (dd: Draft = draft) => {
    if (!useApp.getState().can(mode === 'alter' ? 'master.alter' : 'master.create')) { setError('Your user role is not allowed to do this'); return; }
    const err = mutate((c) => {
      const obj = def.fromDraft(c, dd);
      if (mode === 'alter') alterMaster(c, kind, name!, obj as never);
      else createMaster(c, kind, obj as never);
    });
    if (err) { setError(err); return; }
    setError('');
    const saved = dd.name.trim();
    setHint(`${def.title} "${saved}" ${mode === 'alter' ? 'altered' : 'created'}`);
    if (mode === 'create' && !once) { setDraft({ ...def.blank(useApp.getState().company) }); go(0); }
    else onDone(saved);
  };

  const del = () => {
    if (!useApp.getState().can('master.alter')) { setError('Your user role is not allowed to do this'); setConfirmDel(false); return; }
    const err = mutate((c) => deleteMaster(c, kind, name!));
    if (err) { setError(err); setConfirmDel(false); return; }
    setHint(`${def.title} "${name}" deleted`);
    onDone();
  };

  const act = useRef({ accept, del, quit: () => onDone(), create: () => {} });
  act.current = {
    accept: () => accept(), del, quit: () => onDone(),
    create: () => { if (cur?.type === 'select' && cur.createKind) setNested({ field: cur.key, kind: cur.createKind, name: query }); },
  };

  useEffect(() => {
    setExtra([
      { key: 'Ctrl+A', label: 'Accept', disabled: readOnly, action: () => act.current.accept() },
      { key: 'Alt+C', label: 'Create', action: () => act.current.create() },
      { key: 'Alt+D', label: 'Delete', disabled: mode !== 'alter', action: () => setConfirmDel(true) },
      { key: 'Esc', label: 'Quit', action: () => act.current.quit() },
    ]);
    return () => setExtra([]);
  }, [mode, readOnly, setExtra]);

  /** returns the chosen value (or null if nothing can be chosen) */
  const pickSelect = (f: FieldDef): string | null => {
    const opts = options(f);
    if (opts.length) { const v = opts[Math.min(hi, opts.length - 1)]; set(f.key, v); return v; }
    return !query && draft[f.key] ? draft[f.key] : null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (nested) return;
    const k = e.key;
    const stop = () => { e.preventDefault(); e.stopPropagation(); };
    if (confirmDel) {
      stop();
      if (k === 'y' || k === 'Y' || k === 'Enter') del();
      else if (k === 'n' || k === 'N' || k === 'Escape') setConfirmDel(false);
      return;
    }
    if (k === 'Escape' || (e.ctrlKey && k.toLowerCase() === 'q')) { stop(); onDone(); return; }
    if (readOnly) { if (k === 'Enter') { stop(); go(idx + 1); } return; }
    if (e.ctrlKey && k.toLowerCase() === 'a') { stop(); accept(); return; }
    if (e.altKey && k.toLowerCase() === 'c') { stop(); act.current.create(); return; }
    if (e.altKey && k.toLowerCase() === 'd' && mode === 'alter') { stop(); setConfirmDel(true); return; }
    if (k === 'ArrowUp' && cur.type === 'select') { stop(); setHi((h) => Math.max(0, h - 1)); return; }
    if (k === 'ArrowDown' && cur.type === 'select') { stop(); setHi((h) => Math.min(options(cur).length - 1, h + 1)); return; }
    if (k === 'ArrowUp' || (k === 'Backspace' && cur.type !== 'select' && !draft[cur.key])) { stop(); go(idx - 1); return; }
    if (k === 'Enter') {
      stop();
      let d = draft;
      if (cur.type === 'select') {
        const v = pickSelect(cur);
        if (v === null) { setError(`Select a ${cur.label}`); return; }
        d = { ...draft, [cur.key]: v };
      }
      const count = def.fields.filter((f) => feat(f) && (!f.visible || f.visible(d))).length;
      if (idx >= count - 1) accept(d); else go(idx + 1);
    }
  };

  const shown = (f: FieldDef, i: number) => (i === idx && f.type === 'select' && !readOnly ? query : draft[f.key] ?? '');

  return (
    <div className="panel form-panel" onKeyDown={onKeyDown}>
      <div className="panel-title">{def.title} {mode === 'create' ? 'Creation' : mode === 'alter' ? 'Alteration' : 'Display'}</div>
      <div className="form-body">
        {visible.map((f, i) => (
          <label key={f.key} className={i === idx ? 'frow active' : 'frow'}>
            <span className="flabel">{f.label}</span>
            <span>:</span>
            <input
              ref={(el) => { inputs.current[i] = el; }}
              value={shown(f, i)}
              placeholder={i === idx && f.type === 'select' ? draft[f.key] : f.hint}
              readOnly={readOnly || (f.type === 'select')}
              onFocus={() => setIdx(i)}
              onChange={(e) => (f.type === 'select' ? null : set(f.key, e.target.value))}
              onKeyDownCapture={(e) => {
                // select fields are query-driven: capture printable keys manually
                if (f.type === 'select' && i === idx && !e.ctrlKey && !e.altKey && !readOnly) {
                  if (e.key.length === 1) { e.preventDefault(); setQuery((q) => q + e.key); setHi(0); }
                  else if (e.key === 'Backspace' && query) { e.preventDefault(); e.stopPropagation(); setQuery((q) => q.slice(0, -1)); setHi(0); }
                }
              }}
            />
          </label>
        ))}
      </div>
      {cur?.type === 'select' && !readOnly ? (
        <div className="panel pick-panel">
          <div className="panel-title">List of {cur.label}</div>
          <ul className="menu-list">
            {options(cur).map((o, i) => (
              <li key={o} className={i === hi ? 'menu-item selected' : 'menu-item'} onClick={() => { set(cur.key, o); go(idx + 1); }}>{o}</li>
            ))}
            {!options(cur).length ? <li className="menu-item">End of List</li> : null}
          </ul>
          {cur.createKind ? <div className="typed">Alt+C: create {DEFS[cur.createKind].title}</div> : null}
        </div>
      ) : null}
      {confirmDel ? <div className="form-msg warn">Delete {name}? (Y/N)</div> : null}
      {error ? <div className="form-msg err">{error}</div> : null}
      {nested ? (
        <div className="modal-back">
          <MasterForm
            kind={nested.kind} mode="create" once initial={{ name: nested.name }}
            onDone={(created) => {
              if (created) set(nested.field, created);
              setNested(null);
              if (created) go(idx + 1);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
