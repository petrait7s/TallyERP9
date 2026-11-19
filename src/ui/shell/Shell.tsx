import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyRouter, normalizeKey, type ButtonDef, type KeyHandler } from '../keys';
import { useApp } from '../store';
import { formatDate, weekday } from '../dates';
import { GATEWAY, type MenuItem } from './menus';
import { ButtonBar } from './ButtonBar';
import { StatusBar } from './StatusBar';
import { DateDialog } from './DateDialog';
import { TallyList, useListNav } from '../components/TallyList';
import { MasterFormScreen, MasterList } from '../screens/MasterScreens';
import { VoucherRegister, VoucherScreen } from '../screens/VoucherScreens';
import { LAYOUTS, type Company } from '../../engine';

function voucherMenu(c: Company): MenuItem[] {
  return c.voucherTypes.map((t) => {
    const hk = LAYOUTS[t.kind].hotkey;
    const unique = t.name === t.kind && hk !== 'F10';
    return { label: unique ? `${hk}: ${t.name}` : t.name, voucher: t.name };
  });
}

function findMenu(path: string[], company: Company): MenuItem[] {
  if (path.length === 1 && path[0] === 'Accounting Vouchers') return voucherMenu(company);
  let items = GATEWAY;
  for (const p of path) items = items.find((x) => x.label === p)?.children ?? [];
  return items;
}

function Menu(props: { path: string[]; register: (h: KeyHandler | null) => void }) {
  const { push, pop, setHint, company } = useApp();
  const items = findMenu(props.path, company);
  const title = props.path.length ? props.path[props.path.length - 1] : 'Gateway of Tally';
  const nav = useListNav(items, (i) => {
    const it = items[i];
    if (it.quit) window.close();
    else if (it.voucher) push({ id: 'voucherEntry', title: it.voucher, data: { typeName: it.voucher } });
    else if (it.register) push({ id: 'register', title: it.label });
    else if (it.master)
      push(it.master.mode === 'create'
        ? { id: 'masterForm', title: it.label, data: { kind: it.master.kind, mode: 'create' } }
        : { id: 'masterList', title: it.label, data: { kind: it.master.kind, mode: it.master.mode } });
    else if (it.children) push({ id: 'menu', title: it.label, data: { path: [...props.path, it.label] } });
    else push({ id: 'stub', title: it.label });
  });
  const navRef = useRef(nav);
  navRef.current = nav;

  useEffect(() => {
    props.register({
      id: `menu:${props.path.join('/')}`,
      onKey: (k) => (k === 'Esc' ? (pop(), true) : navRef.current.onKey(k)),
    });
    setHint(props.path.length ? 'Esc: back  Enter: select' : 'Enter: select  F2: date');
    return () => props.register(null);
  }, [props.path.join('/')]);

  return <TallyList title={title} items={items} sel={nav.sel} typed={nav.typed} onPick={nav.setSel} />;
}

function Stub(props: { title: string; register: (h: KeyHandler | null) => void }) {
  const pop = useApp((s) => s.pop);
  useEffect(() => {
    props.register({ id: `stub:${props.title}`, onKey: (k) => (k === 'Esc' ? (pop(), true) : false) });
    return () => props.register(null);
  }, [props.title]);
  return (
    <div className="panel menu-panel">
      <div className="panel-title">{props.title}</div>
      <div className="stub">Not built yet (later phase). Esc: back.</div>
    </div>
  );
}

export function Shell() {
  const { company, currentDate, screens, setDate, setHint, extraButtons } = useApp();
  const router = useRef(new KeyRouter());
  const [handler, setHandler] = useState<KeyHandler | null>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const top = screens[screens.length - 1];

  const register = (h: KeyHandler | null) => {
    router.current.clear();
    if (h) router.current.push(h);
    setHandler(h);
  };

  // global keys wrap the screen handler
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (dateOpen) return;
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT') return;
      if (e.key === 'F2') {
        e.preventDefault();
        setDateOpen(true);
        return;
      }
      if (/^F\d+$/.test(e.key) || e.ctrlKey || e.altKey) e.preventDefault();
      const st = useApp.getState();
      const topId = st.screens[st.screens.length - 1].id;
      if (topId !== 'voucherEntry' && topId !== 'masterForm') {
        const hk = normalizeKey(e);
        const kind = (Object.keys(LAYOUTS) as (keyof typeof LAYOUTS)[]).find((k) => LAYOUTS[k].hotkey === hk && hk !== 'F10');
        if (kind) {
          const vt = st.company.voucherTypes.find((t) => t.name === kind);
          if (vt) st.push({ id: 'voucherEntry', title: vt.name, data: { typeName: vt.name } });
          return;
        }
        if (hk === 'F10') { st.push({ id: 'menu', title: 'Accounting Vouchers', data: { path: ['Accounting Vouchers'] } }); return; }
      }
      if (router.current.dispatch(e)) e.preventDefault();
    };
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, [dateOpen]);

  const buttons: ButtonDef[] = useMemo(() => {
    const base: ButtonDef[] = [
      { key: 'F1', label: 'Select Cmp' },
      { key: 'F2', label: 'Date', action: () => setDateOpen(true) },
      { key: 'F3', label: 'Cmp Info' },
      { key: 'F4', label: 'Contra' }, { key: 'F5', label: 'Payment' }, { key: 'F6', label: 'Receipt' },
      { key: 'F7', label: 'Journal' }, { key: 'F8', label: 'Sales' }, { key: 'F9', label: 'Purchase' },
      { key: 'F10', label: 'Other Vchrs' }, { key: 'F11', label: 'Features' }, { key: 'F12', label: 'Configure' },
    ];
    const topId = screens[screens.length - 1].id;
    const inForm = topId === 'voucherEntry' || topId === 'masterForm';
    for (const b of base) {
      const kind = (Object.keys(LAYOUTS) as (keyof typeof LAYOUTS)[]).find((k) => LAYOUTS[k].hotkey === b.key && b.key !== 'F10');
      if (kind && !inForm) b.action = () => useApp.getState().push({ id: 'voucherEntry', title: kind, data: { typeName: kind } });
      if (b.key === 'F10' && !inForm) b.action = () => useApp.getState().push({ id: 'menu', title: 'Accounting Vouchers', data: { path: ['Accounting Vouchers'] } });
    }
    const own = handler?.buttons?.() ?? [];
    const merged = [...own, ...extraButtons];
    const out = base.map((b) => merged.find((o) => o.key === b.key) ?? b);
    return [...out, ...merged.filter((o) => !base.some((b) => b.key === o.key))];
  }, [handler, extraButtons, screens]);

  return (
    <div className="tally">
      <div className="top-strip">
        <span>TallyLearn NGO (practice edition)</span>
        <span>{company.name}</span>
      </div>
      <div className="main">
        <div className="left">
          <div className="panel info-panel">
            <div>Current Period</div>
            <b>{formatDate(company.fyStart)} to {formatDate(company.fyEnd)}</b>
            <div>Current Date</div>
            <b>{weekday(currentDate)}, {formatDate(currentDate)}</b>
          </div>
        </div>
        <div className="centre">
          {top.id === 'voucherEntry' ? <VoucherScreen typeName={top.data!.typeName as string} voucherId={top.data!.voucherId as number | undefined} register={register} key={top.title + String(top.data!.voucherId ?? '')} />
            : top.id === 'register' ? <VoucherRegister register={register} key="register" />
            : top.id === 'masterList' ? <MasterList kind={top.data!.kind as any} mode={top.data!.mode as any} register={register} key={top.title} />
            : top.id === 'masterForm' ? <MasterFormScreen kind={top.data!.kind as any} mode={top.data!.mode as any} name={top.data!.name as string} register={register} key={top.title + (top.data!.mode as string)} />
            : top.id === 'menu' ? <Menu path={(top.data?.path as string[]) ?? []} register={register} key={top.title} />
            : top.id === 'stub' ? <Stub title={top.title} register={register} key={top.title} />
            : <Menu path={[]} register={register} key="gateway" />}
        </div>
        <ButtonBar buttons={buttons} />
      </div>
      <StatusBar />
      {dateOpen ? (
        <DateDialog
          value={currentDate}
          onAccept={(d) => { setDate(d); setDateOpen(false); setHint(`Date set to ${formatDate(d)}`); }}
          onCancel={() => setDateOpen(false)}
        />
      ) : null}
    </div>
  );
}
