import { useEffect, useRef } from 'react';
import { listMasters, type MasterKind } from '../../engine';
import { MasterForm, type FormMode } from '../components/MasterForm';
import { TallyList, useListNav } from '../components/TallyList';
import type { KeyHandler } from '../keys';
import { useApp } from '../store';
import { DEFS } from './masterDefs';

/** List of existing masters (Alter / Display). Enter opens form. */
export function MasterList(props: { kind: MasterKind; mode: FormMode; register: (h: KeyHandler | null) => void }) {
  const { push, pop, company } = useApp();
  const def = DEFS[props.kind];
  const names = listMasters(company, props.kind);
  const items = [...names.map((label) => ({ label })), { label: 'End of List', heading: true }];
  const nav = useListNav(items, (i) => {
    if (names[i]) push({ id: 'masterForm', title: names[i], data: { kind: props.kind, mode: props.mode, name: names[i] } });
  });
  const ref = useRef(nav);
  ref.current = nav;
  useEffect(() => {
    props.register({ id: `masterList:${props.kind}`, onKey: (k) => (k === 'Esc' ? (pop(), true) : ref.current.onKey(k)) });
    return () => props.register(null);
  }, [props.kind]);
  return <TallyList title={`List of ${def.plural}`} items={items} sel={nav.sel} typed={nav.typed} onPick={nav.setSel} />;
}

export function MasterFormScreen(props: { kind: MasterKind; mode: FormMode; name?: string; register: (h: KeyHandler | null) => void }) {
  const pop = useApp((s) => s.pop);
  useEffect(() => {
    props.register({ id: 'masterForm', onKey: () => false });
    return () => props.register(null);
  }, []);
  return <MasterForm kind={props.kind} mode={props.mode} name={props.name} onDone={() => pop()} />;
}
