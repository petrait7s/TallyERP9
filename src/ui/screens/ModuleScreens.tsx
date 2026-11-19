import { useEffect, useRef, useState } from 'react';
import { alterRow, addRow, deleteRow, regDef, rows, type RegDef, type Row } from '../../engine';
import { SimpleForm, type SField } from '../components/SimpleForm';
import { TallyList, useListNav } from '../components/TallyList';
import { ACTIONS } from '../actions';
import type { KeyHandler } from '../keys';
import { MOD_REPORTS } from '../reports/modules';
import { useApp } from '../store';

type Register = (h: KeyHandler | null) => void;

function useEsc(register: Register, id: string, extra?: (k: string) => boolean) {
  const pop = useApp((s) => s.pop);
  const ex = useRef(extra);
  ex.current = extra;
  useEffect(() => {
    register({ id, onKey: (k) => (ex.current?.(k) ? true : k === 'Esc' ? (pop(), true) : false) });
    return () => register(null);
  }, []);
}

/** Prompt for a module report's arguments, then open it. */
export function AskScreen(props: { mod: string; register: Register }) {
  const { company, pop, push } = useApp();
  const def = MOD_REPORTS[props.mod];
  useEffect(() => { props.register({ id: 'ask', onKey: () => false }); return () => props.register(null); }, []);
  const fields: SField[] = (def.ask ?? []).map((f) => ({ key: f.key, label: f.label, type: 'text', hint: f.hint }));
  return (
    <SimpleForm title={def.title} fields={fields} initial={Object.fromEntries((def.ask ?? []).map((f) => [f.key, f.def(company)]))} onCancel={pop}
      onAccept={(v) => { pop(); push({ id: 'report', title: def.title, data: { params: { id: 'mod', mod: props.mod, arg: Object.entries(v).map(([k, x]) => `${k}=${x}`).join('|') } } }); return null; }} />
  );
}

/** Run a module action (post payroll, depreciation, ...). */
export function ActionScreen(props: { action: string; register: Register }) {
  const { company, pop, mutate, setHint, can } = useApp();
  const a = ACTIONS[props.action];
  useEffect(() => { props.register({ id: 'action', onKey: () => false }); return () => props.register(null); }, []);
  return (
    <SimpleForm title={a.title} fields={a.fields.map((f) => ({ key: f.key, label: f.label, type: 'text', hint: f.hint }))}
      initial={Object.fromEntries(a.fields.map((f) => [f.key, f.def(company)]))} onCancel={pop}
      onAccept={(v) => {
        if (!can('voucher.create')) return 'Your user role is not allowed to post entries';
        let msg = '';
        const err = mutate((c) => { msg = a.run(c, v); });
        if (err) return err;
        setHint(msg);
        pop();
        return null;
      }} />
  );
}

const fieldsFor = (d: RegDef): SField[] => d.fields.map((f) => ({ key: f.key, label: f.label, type: 'text', hint: f.type === 'select' ? f.options!.join(' / ') : f.type === 'date' ? 'yyyy-mm-dd' : f.type === 'amount' ? '0.00' : undefined }));

export function RegisterForm(props: { reg: string; index?: number; register: Register }) {
  const { pop, mutate, setHint, can } = useApp();
  const def = regDef(props.reg);
  const company = useApp((s) => s.company);
  const existing: Row | undefined = props.index === undefined ? undefined : rows(company, props.reg)[props.index];
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    props.register({
      id: 'regform',
      onKey: (k) => {
        if (confirm) { if (k === 'y' || k === 'Y') { const e = mutate((c) => deleteRow(c, props.reg, props.index!)); setHint(e ?? 'Record deleted'); pop(); } else if (k === 'n' || k === 'N' || k === 'Esc') setConfirm(false); return true; }
        if (k === 'Alt+D' && existing) { setConfirm(true); return true; }
        return false;
      },
    });
    return () => props.register(null);
  }, [confirm, existing]);
  return (
    <>
      <SimpleForm title={`${def.title}: ${existing ? 'Alteration' : 'Creation'}`} fields={fieldsFor(def)}
        initial={Object.fromEntries(def.fields.map((f) => [f.key, existing?.[f.key] ?? '']))} onCancel={pop}
        onAccept={(v) => {
          if (!can(existing ? 'master.alter' : 'master.create')) return 'Your user role is not allowed to do this';
          const err = mutate((c) => { if (existing) alterRow(c, props.reg, props.index!, v); else addRow(c, props.reg, v); });
          if (err) return err;
          setHint(`${def.title} ${existing ? 'altered' : 'created'}`);
          pop();
          return null;
        }} />
      {confirm ? <div className="form-msg warn">Delete this record? (Y/N)  Alt+D to delete</div> : null}
    </>
  );
}

/** List of register rows; first line creates a new one. */
export function RegisterList(props: { reg: string; register: Register }) {
  const { company, push } = useApp();
  const def = regDef(props.reg);
  const list = rows(company, props.reg);
  const label = (r: Row) => def.fields.slice(0, 3).map((f) => r[f.key] ?? '').join('  |  ');
  const items = [{ label: '+ Create new' }, ...list.map((r) => ({ label: label(r) })), { label: 'End of List', heading: true }];
  const nav = useListNav(items, (i) => push({ id: 'regForm', title: def.title, data: { reg: props.reg, index: i === 0 ? undefined : i - 1 } }));
  const ref = useRef(nav);
  ref.current = nav;
  useEsc(props.register, 'regList', (k) => ref.current.onKey(k));
  return <TallyList title={`${def.title} (${list.length})`} items={items} sel={nav.sel} typed={nav.typed} onPick={nav.setSel} wide />;
}
