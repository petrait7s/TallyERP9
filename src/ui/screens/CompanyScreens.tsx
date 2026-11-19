import { useEffect, useRef, useState } from 'react';
import {
  allFeatures, carryForward, checkIntegrity, createCompany, parseCompanyFile, serializeCompany, type Company,
} from '../../engine';
import { SimpleForm } from '../components/SimpleForm';
import { TallyList, useListNav } from '../components/TallyList';
import { formatDate, fyEndFor, nextDay, parseTallyDate } from '../dates';
import type { KeyHandler } from '../keys';
import { getAdapter, loadCompanyFile, saveCompany, uid, type CompanyMeta } from '../persist';
import { flushSave, useApp } from '../store';

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

function Message(props: { title: string; lines: string[]; register: Register }) {
  useEsc(props.register, 'message');
  return (
    <div className="panel menu-panel wide">
      <div className="panel-title">{props.title}</div>
      <div className="stub" style={{ textAlign: 'left' }}>{props.lines.map((l, i) => <div key={i}>{l}</div>)}<div className="typed">Esc: back</div></div>
    </div>
  );
}

export async function switchCompany(id: string, password?: string): Promise<string | null> {
  await flushSave();
  const c = await loadCompanyFile(id);
  if (!c) return 'Company file not found';
  if (c.meta.vault && password !== c.meta.vault) return 'VAULT';
  useApp.getState().openCompany(id, c);
  await getAdapter().setLast(id);
  return null;
}

function CompanyList(props: { mode: 'select' | 'alter' | 'delete'; register: Register }) {
  const { companyId, push, pop, setHint } = useApp();
  const [metas, setMetas] = useState<CompanyMeta[]>([]);
  const [confirm, setConfirm] = useState<string | null>(null);
  const reload = () => getAdapter().list().then(setMetas);
  useEffect(() => { void reload(); }, []);
  const items = [...metas.map((m) => ({ label: `${m.name}${m.id === companyId ? '  (open)' : ''}` })), { label: 'End of List', heading: true }];
  const nav = useListNav(items, (i) => {
    const m = metas[i];
    if (!m) return;
    if (props.mode === 'select') void switchCompany(m.id).then((e) => (e === 'VAULT' ? push({ id: 'company', title: 'Tally Vault', data: { action: 'unlock', cid: m.id } }) : setHint(e ?? `Opened ${m.name}`)));
    else if (props.mode === 'alter') push({ id: 'company', title: 'Alter Company', data: { action: 'alter', cid: m.id } });
    else if (m.id === companyId) setHint('Cannot delete the open company');
    else setConfirm(m.id);
  });
  const ref = useRef({ nav, confirm, metas });
  ref.current = { nav, confirm, metas };

  useEsc(props.register, 'companyList', (k) => {
    const r = ref.current;
    if (r.confirm) {
      if (k === 'y' || k === 'Y') {
        const id = r.confirm;
        void getAdapter().remove(id).then(() => { setConfirm(null); setHint('Company deleted (file kept as .deleted)'); void reload(); });
      } else if (k === 'n' || k === 'N' || k === 'Esc') setConfirm(null);
      return true;
    }
    if (k === 'Esc') { pop(); return true; }
    return r.nav.onKey(k);
  });

  const title = props.mode === 'select' ? 'List of Companies' : props.mode === 'alter' ? 'Alter Company: select' : 'Delete Company: select';
  return (
    <>
      <TallyList title={title} items={items} sel={nav.sel} typed={nav.typed} onPick={nav.setSel} />
      {confirm ? <div className="form-msg warn">Delete {metas.find((m) => m.id === confirm)?.name}? (Y/N)</div> : null}
    </>
  );
}

const asIso = (t: string, def: string) => parseTallyDate(t, def);

function CompanyCreate(props: { register: Register }) {
  const { pop, setHint } = useApp();
  useEffect(() => { props.register({ id: 'companyCreate', onKey: () => false }); return () => props.register(null); }, []);
  return (
    <SimpleForm
      title="Company Creation"
      fields={[
        { key: 'name', label: 'Company Name', type: 'text' },
        { key: 'start', label: 'Financial year beginning from', type: 'text', hint: '1-4-2025' },
        { key: 'currency', label: 'Base currency', type: 'text' },
        { key: 'all', label: 'Enable all features (F11)', type: 'yesno' },
      ]}
      initial={{ name: '', start: '1-Apr-2025', currency: 'BDT', all: 'No' }}
      onCancel={pop}
      onAccept={async (v) => {
        if (!v.name.trim()) return 'Company name cannot be blank';
        const start = asIso(v.start, '2025-04-01');
        if (!start) return 'Invalid date';
        if (!v.currency.trim()) return 'Currency required';
        const c = createCompany(v.name.trim(), start, fyEndFor(start), v.currency.trim().toUpperCase(), allFeatures(v.all === 'Yes'));
        const id = uid();
        await saveCompany(id, c);
        const e = await switchCompany(id);
        if (e) return e;
        setHint(`Company "${c.name}" created`);
        return null;
      }}
    />
  );
}

function CompanyAlter(props: { cid: string; register: Register }) {
  const { pop, setHint, companyId, mutate } = useApp();
  const [c, setC] = useState<Company | null>(null);
  useEffect(() => { void loadCompanyFile(props.cid).then(setC); }, [props.cid]);
  useEffect(() => { props.register({ id: 'companyAlter', onKey: () => false }); return () => props.register(null); }, []);
  if (!c) return <Message title="Alter Company" lines={['Loading...']} register={props.register} />;
  return (
    <SimpleForm
      title="Company Alteration"
      fields={[{ key: 'name', label: 'Company Name', type: 'text' }]}
      initial={{ name: c.name }}
      onCancel={pop}
      onAccept={async (v) => {
        if (!v.name.trim()) return 'Company name cannot be blank';
        if (props.cid === companyId) {
          const err = mutate((x) => { x.name = v.name.trim(); });
          if (err) return err;
        } else await saveCompany(props.cid, { ...c, name: v.name.trim() });
        setHint('Company altered');
        pop();
        return null;
      }}
    />
  );
}

function CompanySplit(props: { register: Register }) {
  const { company, pop, push } = useApp();
  useEffect(() => { props.register({ id: 'companySplit', onKey: () => false }); return () => props.register(null); }, []);
  const start = nextDay(company.fyEnd);
  return (
    <SimpleForm
      title="Split Company Data (carry forward)"
      fields={[
        { key: 'name', label: 'New company name', type: 'text' },
        { key: 'start', label: 'New financial year beginning', type: 'text' },
      ]}
      initial={{ name: `${company.name} (${start.slice(0, 4)}-${String(Number(start.slice(0, 4)) + 1).slice(2)})`, start: formatDate(start) }}
      onCancel={pop}
      onAccept={async (v) => {
        if (!v.name.trim()) return 'Name cannot be blank';
        const s = asIso(v.start, start);
        if (!s) return 'Invalid date';
        if (s <= company.fyEnd) return 'New year must begin after the current year ends';
        const next = carryForward(company, v.name.trim(), s, fyEndFor(s));
        await saveCompany(uid(), next);
        pop();
        push({ id: 'company', title: 'Split done', data: { action: 'message', lines: [`Created "${next.name}" (${formatDate(next.fyStart)} to ${formatDate(next.fyEnd)})`, 'Closing balances, bills and masters were carried forward.', 'Open it from F1: Select Cmp.'] } });
        return null;
      }}
    />
  );
}

function Backup(props: { register: Register }) {
  const { company, companyId } = useApp();
  const [lines, setLines] = useState<string[]>(['Saving...']);
  useEffect(() => {
    const name = `${company.name.replace(/[^\w]+/g, '_')}-${new Date().toISOString().slice(0, 10)}.tlbak.json`;
    void flushSave().then(() => getAdapter().saveText(name, serializeCompany(company, companyId))).then((p) =>
      setLines(p ? [`Backup saved: ${p}`] : ['Backup cancelled']));
  }, []);
  return <Message title="Backup Company Data" lines={lines} register={props.register} />;
}

export async function importCompanyText(text: string): Promise<{ name: string; id: string }> {
  const { company } = parseCompanyFile(text);
  const names = new Set((await getAdapter().list()).map((m) => m.name));
  let name = company.name;
  if (names.has(name)) name = `${name} (restored)`;
  const id = uid();
  await saveCompany(id, { ...company, name });
  return { name, id };
}

function Restore(props: { register: Register }) {
  const [lines, setLines] = useState<string[]>(['Choose a backup file...']);
  const input = useRef<HTMLInputElement>(null);
  const run = async (text: string | null | undefined) => {
    if (text === null) return setLines(['Restore cancelled']);
    try {
      const r = await importCompanyText(text!);
      setLines([`Restored as "${r.name}".`, 'Open it from F1: Select Cmp.']);
    } catch (e) { setLines([`Restore failed: ${(e as Error).message}`]); }
  };
  useEffect(() => {
    void getAdapter().openText().then((t) => { if (t !== undefined) void run(t); else input.current?.click(); });
  }, []);
  useEsc(props.register, 'restore', (k) => (k === 'Enter' ? (input.current?.click(), true) : false));
  return (
    <div className="panel menu-panel wide">
      <div className="panel-title">Restore Company Data</div>
      <div className="stub" style={{ textAlign: 'left' }}>
        {lines.map((l, i) => <div key={i}>{l}</div>)}
        <input ref={input} type="file" accept=".json,.tlbak" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await run(await f.text()); }} />
        <div className="typed">Enter: choose file &nbsp; Esc: back</div>
      </div>
    </div>
  );
}

function Repair(props: { register: Register }) {
  const company = useApp((s) => s.company);
  const issues = checkIntegrity(company);
  return <Message title="Data Repair: integrity check" lines={issues.length ? [`${issues.length} issue(s) found:`, ...issues.slice(0, 20)] : ['No problems found. Vouchers balance, all references resolve, opening balances agree.']} register={props.register} />;
}

function Unlock(props: { cid: string; register: Register }) {
  const { pop, setHint } = useApp();
  useEffect(() => { props.register({ id: 'unlock', onKey: () => false }); return () => props.register(null); }, []);
  return (
    <SimpleForm title="Tally Vault: company is password protected" fields={[{ key: 'pw', label: 'Password', type: 'text' }]} initial={{ pw: '' }} onCancel={pop}
      onAccept={async (v) => { const e = await switchCompany(props.cid, v.pw); if (e) return e === 'VAULT' ? 'Incorrect password' : e; setHint('Company opened'); return null; }} />
  );
}

function Login(props: { register: Register }) {
  const { company, pop, setUser, setHint } = useApp();
  useEffect(() => { props.register({ id: 'login', onKey: () => false }); return () => props.register(null); }, []);
  const users = company.registers.users ?? [];
  return (
    <SimpleForm title="Select User" fields={[{ key: 'name', label: 'User name', type: 'text', hint: users.map((u) => u.name).join(' / ') || 'admin' }, { key: 'pw', label: 'Password', type: 'text' }]}
      initial={{ name: users[0]?.name ?? 'admin', pw: '' }} onCancel={pop}
      onAccept={(v) => {
        if (!users.length) { setUser({ name: v.name || 'admin', role: 'Admin' }); pop(); return null; }
        const u = users.find((x) => x.name === v.name);
        if (!u || u.password !== v.pw) return 'Invalid user or password';
        setUser({ name: u.name, role: u.role as never });
        setHint(`Signed in as ${u.name} (${u.role})`);
        pop();
        return null;
      }} />
  );
}

export function CompanyScreen(props: { action: string; cid?: string; lines?: string[]; title?: string; register: Register }) {
  const r = props.register;
  switch (props.action) {
    case 'select': return <CompanyList mode="select" register={r} />;
    case 'alter-list': return <CompanyList mode="alter" register={r} />;
    case 'delete': return <CompanyList mode="delete" register={r} />;
    case 'alter': return <CompanyAlter cid={props.cid!} register={r} />;
    case 'create': return <CompanyCreate register={r} />;
    case 'split': return <CompanySplit register={r} />;
    case 'backup': return <Backup register={r} />;
    case 'restore': return <Restore register={r} />;
    case 'repair': return <Repair register={r} />;
    case 'unlock': return <Unlock cid={props.cid!} register={r} />;
    case 'login': return <Login register={r} />;
    default: return <Message title={props.title ?? 'Information'} lines={props.lines ?? []} register={r} />;
  }
}
