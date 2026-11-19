import { useEffect, useRef, useState } from 'react';
import {
  addVoucher, alterVoucher, cancelVoucher, deleteVoucher, formatAmount, isUnder, LAYOUTS, nextVoucherNumber, toPaisa,
  type BillRef, type Company, type CostAlloc, type Entry, type Paisa,
} from '../../engine';
import { formatDate, parseTallyDate, weekday } from '../dates';
import { useApp } from '../store';
import { AllocDialog } from './AllocDialog';
import { MasterForm } from './MasterForm';
import { PickInput } from './PickInput';

type Side = 'Dr' | 'Cr';
interface Line { side: Side; ledger: string; amount: string; costs?: CostAlloc[]; bills?: BillRef[] }
const END = 'End of List';
const blank = (side: Side): Line => ({ side, ledger: '', amount: '' });
const safe = (s: string): Paisa => { try { return s.trim() ? toPaisa(s) : 0; } catch { return NaN; } };

interface Props {
  typeName: string;
  /** voucher id to alter; omit to create */
  voucherId?: number;
  onDone: () => void;
}

function cashBankDefault(c: Company, groups: string[]): string {
  const l = c.ledgers.filter((x) => groups.some((g) => isUnder(c.groups, x.group, g)));
  return (l.find((x) => x.name === 'Cash') ?? l[0])?.name ?? '';
}

export function VoucherForm({ typeName, voucherId, onDone }: Props) {
  const company = useApp((s) => s.company);
  const currentDate = useApp((s) => s.currentDate);
  const mutate = useApp((s) => s.mutate);
  const setHint = useApp((s) => s.setHint);
  const setExtra = useApp((s) => s.setExtraButtons);

  const vt = company.voucherTypes.find((t) => t.name === typeName)!;
  const base = LAYOUTS[vt.kind];
  const existing = voucherId ? company.vouchers.find((v) => v.id === voucherId) : undefined;
  const mode = existing ? 'alter' : 'create';

  // Single layout needs exactly one account-side entry in the account groups; otherwise fall back to double.
  const singleOk = (() => {
    if (base.mode !== 'single') return false;
    if (!existing) return true;
    const sign = base.accountSide === 'Dr' ? 1 : -1;
    const acc = existing.entries.filter((e) => Math.sign(e.amount) === sign);
    return acc.length === 1 && base.accountGroups!.some((g) => isUnder(company.groups, company.ledgers.find((l) => l.name === acc[0].ledger)!.group, g));
  })();
  const single = base.mode === 'single' && singleOk;
  const partSide: Side = base.accountSide === 'Dr' ? 'Cr' : 'Dr';

  const initLines = (): { account: string; lines: Line[]; accBills?: BillRef[]; accCosts?: CostAlloc[] } => {
    if (existing) {
      const toLine = (e: Entry): Line => ({ side: e.amount > 0 ? 'Dr' : 'Cr', ledger: e.ledger, amount: formatAmount(Math.abs(e.amount)), costs: e.costCentres, bills: e.bills });
      if (single) {
        const sign = base.accountSide === 'Dr' ? 1 : -1;
        const acc = existing.entries.find((e) => Math.sign(e.amount) === sign)!;
        return { account: acc.ledger, accBills: acc.bills, accCosts: acc.costCentres, lines: [...existing.entries.filter((e) => e !== acc).map(toLine), blank(partSide)] };
      }
      return { account: '', lines: [...existing.entries.map(toLine), blank('Dr')] };
    }
    return single
      ? { account: cashBankDefault(company, base.accountGroups!), lines: [blank(partSide)] }
      : { account: '', lines: [blank('Dr')] };
  };
  const init = useRef(initLines()).current;

  const startDate = existing?.date ?? (currentDate >= company.fyStart && currentDate <= company.fyEnd ? currentDate : company.fyStart);
  const [dateIso, setDateIso] = useState(startDate);
  const [dateText, setDateText] = useState(formatDate(startDate));
  const [account, setAccount] = useState(init.account);
  const [accBills, setAccBills] = useState(init.accBills);
  const [accCosts, setAccCosts] = useState(init.accCosts);
  const [lines, setLines] = useState<Line[]>(init.lines);
  const [narration, setNarration] = useState(existing?.narration ?? '');
  const [focus, setFocus] = useState('date');
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<'' | 'delete' | 'cancel'>('');
  const [alloc, setAlloc] = useState<{ target: number | 'account'; kind: 'cost' | 'bill' } | null>(null);
  const [nested, setNested] = useState<{ name: string; onCreated: (n: string) => void } | null>(null);
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  const typedQuery = useRef('');

  const number = existing?.number ?? nextVoucherNumber(company, typeName);

  // ---- derived
  const lineTotal = lines.reduce((s, l) => s + (l.ledger ? safe(l.amount) || 0 : 0), 0);
  const dr = lines.filter((l) => l.side === 'Dr' && l.ledger).reduce((s, l) => s + (safe(l.amount) || 0), 0);
  const cr = lines.filter((l) => l.side === 'Cr' && l.ledger).reduce((s, l) => s + (safe(l.amount) || 0), 0);

  const ids: string[] = ['date'];
  if (single) ids.push('account');
  lines.forEach((l, i) => {
    if (!single) ids.push(`${i}.side`);
    ids.push(`${i}.ledger`);
    if (l.ledger) ids.push(`${i}.amount`);
  });
  ids.push('narration');

  const goto = (id: string) => { setFocus(id); setError(''); };
  const nextId = (id: string) => ids[Math.min(ids.length - 1, ids.indexOf(id) + 1)];
  const prevId = (id: string) => ids[Math.max(0, ids.indexOf(id) - 1)];

  useEffect(() => { if (!alloc && !nested) refs.current[focus]?.focus(); }, [focus, alloc, nested, lines.length]);

  const ledgerNames = (i: number): string[] => {
    let ls = company.ledgers;
    if (base.allowedGroups) ls = ls.filter((l) => base.allowedGroups!.some((g) => isUnder(company.groups, l.group, g)));
    let names = ls.map((l) => l.name).filter((n) => !(single && n === account));
    if (i > 0 && !lines[i].ledger && lines[i - 1].ledger) names = [END, ...names];
    if (i > 0 && !single && !lines[i].ledger && lines[i - 1].ledger) return names;
    return names;
  };
  const accountNames = () =>
    company.ledgers.filter((l) => base.accountGroups!.some((g) => isUnder(company.groups, l.group, g))).map((l) => l.name);

  const setLine = (i: number, patch: Partial<Line>) => setLines((xs) => xs.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const ledgerOf = (n: string) => company.ledgers.find((l) => l.name === n);

  // ---- allocation flow
  const finishTarget = (t: number | 'account') => {
    setAlloc(null);
    goto(t === 'account' ? 'narration' : nextId(`${t}.amount`));
  };
  const startAlloc = (t: number | 'account', from: 'amount' | 'cost') => {
    const name = t === 'account' ? account : lines[t].ledger;
    const l = ledgerOf(name);
    if (from === 'amount' && l?.costCentresApplicable && company.costCentres.length) { setAlloc({ target: t, kind: 'cost' }); return; }
    if (l?.billWise) { setAlloc({ target: t, kind: 'bill' }); return; }
    finishTarget(t);
  };
  const allocTotal = (t: number | 'account') => (t === 'account' ? lineTotal : safe(lines[t].amount) || 0);
  const allocSign = (t: number | 'account'): 1 | -1 => (t === 'account' ? (base.accountSide === 'Dr' ? 1 : -1) : lines[t].side === 'Dr' ? 1 : -1);

  const onAllocDone = (res: CostAlloc[] | BillRef[] | null) => {
    if (!alloc) return;
    const { target, kind } = alloc;
    if (kind === 'cost') {
      if (target === 'account') setAccCosts((res as CostAlloc[]) ?? undefined);
      else setLine(target, { costs: (res as CostAlloc[]) ?? undefined });
      startAlloc(target, 'cost');
    } else {
      if (target === 'account') setAccBills((res as BillRef[]) ?? undefined);
      else setLine(target, { bills: (res as BillRef[]) ?? undefined });
      finishTarget(target);
    }
  };

  // ---- build + save
  const buildEntries = (): Entry[] => {
    const withBills = (name: string, amt: Paisa, bills?: BillRef[]) =>
      ledgerOf(name)?.billWise ? (bills?.length ? bills : [{ method: 'On Account' as const, ref: '', amount: Math.abs(amt) }]) : undefined;
    const out: Entry[] = [];
    for (const l of lines.filter((x) => x.ledger)) {
      const p = safe(l.amount);
      if (!(p > 0)) throw new Error(`Enter amount for ${l.ledger}`);
      const amount = l.side === 'Dr' ? p : -p;
      out.push({ ledger: l.ledger, amount, costCentres: l.costs?.length ? l.costs : undefined, bills: withBills(l.ledger, amount, l.bills) });
    }
    if (single) {
      if (!account) throw new Error(`Select ${base.accountLabel}`);
      const amount = (base.accountSide === 'Dr' ? 1 : -1) * out.reduce((s, e) => s + Math.abs(e.amount), 0);
      out.unshift({ ledger: account, amount, costCentres: accCosts?.length ? accCosts : undefined, bills: withBills(account, amount, accBills) });
    }
    return out;
  };

  const resetForNext = () => {
    setLines(single ? [blank(partSide)] : [blank('Dr')]);
    setAccBills(undefined); setAccCosts(undefined); setNarration('');
    goto('date');
  };

  const accept = () => {
    let entries: Entry[];
    try { entries = buildEntries(); } catch (e) { setError((e as Error).message); return; }
    const err = mutate((c) => {
      if (existing) alterVoucher(c, existing.id, { date: dateIso, entries, narration: narration || undefined });
      else addVoucher(c, { type: typeName, date: dateIso, entries, narration: narration || undefined });
    });
    if (err) { setError(err); return; }
    setHint(`${typeName} voucher ${number} ${existing ? 'altered' : 'created'}`);
    if (existing) onDone(); else resetForNext();
  };
  const doDelete = () => {
    const err = mutate((c) => deleteVoucher(c, existing!.id));
    if (err) { setError(err); setConfirm(''); return; }
    setHint(`${typeName} voucher ${number} deleted`);
    onDone();
  };
  const doCancel = () => {
    const err = mutate((c) => cancelVoucher(c, existing!.id));
    if (err) { setError(err); setConfirm(''); return; }
    setHint(`${typeName} voucher ${number} cancelled`);
    onDone();
  };

  const act = useRef({ accept, create: () => {}, quit: onDone });
  const createOnFly = () => {
    if (focus.endsWith('.ledger') || focus === 'account')
      setNested({ name: typedQuery.current, onCreated: (n) => (focus === 'account' ? (setAccount(n), goto(nextId('account'))) : pickLedger(Number(focus.split('.')[0]), n)) });
  };
  act.current = { accept, create: createOnFly, quit: onDone };
  useEffect(() => {
    setExtra([
      { key: 'Ctrl+A', label: 'Accept', action: () => act.current.accept() },
      { key: 'Alt+C', label: 'Create', action: () => act.current.create() },
      { key: 'Alt+D', label: 'Delete', disabled: mode !== 'alter', action: () => setConfirm('delete') },
      { key: 'Alt+X', label: 'Cancel Vch', disabled: mode !== 'alter', action: () => setConfirm('cancel') },
      { key: 'Esc', label: 'Quit', action: () => act.current.quit() },
    ]);
    return () => setExtra([]);
  }, [mode, setExtra]);

  // ---- picks
  const pickLedger = (i: number, v: string) => {
    if (v === END) { startAllocOrNarr(); return; }
    let side = lines[i].side;
    let amt = lines[i].amount;
    if (!single && !lines[i].ledger) {
      // balancing side/amount from the other lines
      const others = lines.filter((_, k) => k !== i && lines[k].ledger);
      const d = others.filter((l) => l.side === 'Dr').reduce((x, l) => x + (safe(l.amount) || 0), 0);
      const c = others.filter((l) => l.side === 'Cr').reduce((x, l) => x + (safe(l.amount) || 0), 0);
      if (d > c) { side = 'Cr'; amt = formatAmount(d - c); }
      else if (c > d) { side = 'Dr'; amt = formatAmount(c - d); }
    }
    setLines((xs) => {
      const ys = xs.map((x, k) => (k === i ? { ...x, side, ledger: v, amount: amt, costs: undefined, bills: undefined } : x));
      if (i === ys.length - 1) ys.push(blank(single ? partSide : 'Dr'));
      return ys;
    });
    goto(`${i}.amount`);
  };
  const startAllocOrNarr = () => {
    if (!lines.some((l) => l.ledger)) { setError('Enter at least one line'); return; }
    if (single) startAlloc('account', 'amount'); else goto('narration');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (nested || alloc) return;
    const k = e.key;
    const stop = () => { e.preventDefault(); e.stopPropagation(); };
    if (confirm) {
      stop();
      if (k === 'y' || k === 'Y' || k === 'Enter') (confirm === 'delete' ? doDelete : doCancel)();
      else if (k === 'n' || k === 'N' || k === 'Escape') setConfirm('');
      return;
    }
    if (k === 'Escape' || (e.ctrlKey && k.toLowerCase() === 'q')) { stop(); onDone(); return; }
    if (e.ctrlKey && k.toLowerCase() === 'a') { stop(); accept(); return; }
    if (e.altKey && k.toLowerCase() === 'c') { stop(); createOnFly(); return; }
    if (mode === 'alter' && e.altKey && k.toLowerCase() === 'd') { stop(); setConfirm('delete'); return; }
    if (mode === 'alter' && e.altKey && k.toLowerCase() === 'x') { stop(); setConfirm('cancel'); return; }
    if (e.ctrlKey || e.altKey) return;

    if (focus.endsWith('.side') && (k === 'd' || k === 'D' || k === 'c' || k === 'C' || k === ' ')) {
      stop();
      const i = Number(focus.split('.')[0]);
      setLine(i, { side: k === ' ' ? (lines[i].side === 'Dr' ? 'Cr' : 'Dr') : k.toLowerCase() === 'd' ? 'Dr' : 'Cr' });
      return;
    }
    if (k === 'ArrowUp' || (k === 'Backspace' && !(e.target as HTMLInputElement).value)) { stop(); goto(prevId(focus)); return; }
    if (k !== 'Enter') return;
    stop();
    if (focus === 'date') {
      const iso = parseTallyDate(dateText, dateIso);
      if (!iso) { setError('Invalid date'); return; }
      if (iso < company.fyStart || iso > company.fyEnd) { setError('Date outside financial year'); return; }
      setDateIso(iso); setDateText(formatDate(iso)); goto(nextId('date'));
    } else if (focus.endsWith('.side')) goto(nextId(focus));
    else if (focus.endsWith('.amount')) {
      const i = Number(focus.split('.')[0]);
      const p = safe(lines[i].amount);
      if (!(p > 0)) { setError('Enter a positive amount'); return; }
      setLine(i, { amount: formatAmount(p) });
      startAlloc(i, 'amount');
    } else if (focus === 'narration') accept();
  };

  const row = (l: Line, i: number) => (
    <tr key={i}>
      {!single ? (
        <td className="c-side">
          <input ref={(el) => { refs.current[`${i}.side`] = el; }} value={l.side} readOnly onFocus={() => setFocus(`${i}.side`)} className={focus === `${i}.side` ? 'hot' : ''} />
        </td>
      ) : null}
      <td>
        <PickInput
          queryRef={typedQuery} value={l.ledger} active={focus === `${i}.ledger`} options={ledgerNames(i)}
          onPick={(v) => pickLedger(i, v)} onFocus={() => setFocus(`${i}.ledger`)}
          inputRef={(el) => { refs.current[`${i}.ledger`] = el; }}
          placeholder={i === 0 ? 'Particulars' : ''}
        />
      </td>
      <td className="c-amt">
        {l.ledger ? (
          <input
            ref={(el) => { refs.current[`${i}.amount`] = el; }} className={`num ${focus === `${i}.amount` ? 'hot' : ''}`}
            value={l.amount} onFocus={() => setFocus(`${i}.amount`)} onChange={(e) => setLine(i, { amount: e.target.value })}
          />
        ) : null}
      </td>
    </tr>
  );

  return (
    <div className="panel voucher-panel" onKeyDown={onKeyDown}>
      <div className="panel-title">Accounting Voucher {mode === 'alter' ? 'Alteration' : 'Creation'}{existing?.cancelled ? ' (Cancelled)' : ''}</div>
      <div className="v-head">
        <span className="v-type">{typeName}</span>
        <span>No. <b>{number}</b></span>
        <span className="v-date">
          Date:&nbsp;
          <input
            ref={(el) => { refs.current.date = el; }} className={focus === 'date' ? 'hot' : ''} value={dateText}
            onFocus={(e) => { setFocus('date'); e.target.select(); }} onChange={(e) => setDateText(e.target.value)}
          />
          <small> {weekday(dateIso)}</small>
        </span>
      </div>
      {single ? (
        <div className="v-account">
          <span>{base.accountLabel}</span>
          <PickInput queryRef={typedQuery} value={account} active={focus === 'account'} options={accountNames()}
            onPick={(v) => { setAccount(v); setAccBills(undefined); setAccCosts(undefined); goto(nextId('account')); }}
            onFocus={() => setFocus('account')} inputRef={(el) => { refs.current.account = el; }} />
          <span className="num acc-total">{lineTotal ? `${formatAmount(lineTotal)} ${base.accountSide}` : ''}</span>
        </div>
      ) : null}
      <table className="v-table">
        <thead><tr>{!single ? <th /> : null}<th>Particulars</th><th>Amount</th></tr></thead>
        <tbody>{lines.map(row)}</tbody>
      </table>
      {!single ? <div className="v-totals">Dr {formatAmount(dr)} &nbsp; Cr {formatAmount(cr)}{dr !== cr ? ` (diff ${formatAmount(Math.abs(dr - cr))})` : ''}</div> : null}
      <div className="v-narr">
        Narration:&nbsp;
        <input ref={(el) => { refs.current.narration = el; }} className={focus === 'narration' ? 'hot' : ''} value={narration}
          onFocus={() => setFocus('narration')} onChange={(e) => setNarration(e.target.value)} />
      </div>
      {confirm ? <div className="form-msg warn">{confirm === 'delete' ? 'Delete' : 'Cancel'} this voucher? (Y/N)</div> : null}
      {error ? <div className="form-msg err">{error}</div> : null}
      {alloc ? (
        <AllocDialog
          kind={alloc.kind} company={company} total={allocTotal(alloc.target)} sign={allocSign(alloc.target)}
          ledger={alloc.target === 'account' ? account : lines[alloc.target].ledger} excludeVoucherId={existing?.id}
          onDone={onAllocDone}
        />
      ) : null}
      {nested ? (
        <div className="modal-back">
          <MasterForm kind="ledger" mode="create" once initial={{ name: nested.name }}
            onDone={(n) => { const cb = nested.onCreated; setNested(null); if (n) { cb(n); } }} />
        </div>
      ) : null}
    </div>
  );
}
