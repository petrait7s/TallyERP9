import { useEffect, useRef } from 'react';
import { duplicateVoucher, formatAmount, postedVouchers, type Voucher } from '../../engine';
import { TallyList, useListNav } from '../components/TallyList';
import { VoucherForm } from '../components/VoucherForm';
import { formatDate } from '../dates';
import type { KeyHandler } from '../keys';
import { useApp } from '../store';

export function VoucherScreen(props: { typeName: string; voucherId?: number; register: (h: KeyHandler | null) => void }) {
  const pop = useApp((s) => s.pop);
  useEffect(() => {
    props.register({ id: 'voucher', onKey: () => false });
    return () => props.register(null);
  }, []);
  return <VoucherForm typeName={props.typeName} voucherId={props.voucherId} onDone={pop} />;
}

function summary(v: Voucher): string {
  const dr = v.entries.filter((e) => e.amount > 0);
  const total = dr.reduce((s, e) => s + e.amount, 0);
  const first = dr[0]?.ledger ?? '';
  const flag = v.cancelled ? ' (Cancelled)' : v.optional ? ' (Optional)' : v.postDated ? ' (Post-dated)' : '';
  return `${formatDate(v.date).padEnd(12)} ${v.type.padEnd(18)} ${v.number.padStart(4)}  ${first.padEnd(28)} ${formatAmount(total).padStart(14)}${flag}`;
}

/** Simple voucher register (full Day Book report with drill-down arrives in P5). */
export function VoucherRegister(props: { register: (h: KeyHandler | null) => void }) {
  const { company, push, pop, mutate, setHint } = useApp();
  const vs = [...company.vouchers].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  const items = [...vs.map((v) => ({ label: summary(v) })), { label: 'End of List', heading: true }];
  const nav = useListNav(items, (i) => {
    const v = vs[i];
    if (v) push({ id: 'voucherEntry', title: `${v.type} ${v.number}`, data: { typeName: v.type, voucherId: v.id } });
  });
  const ref = useRef(nav);
  ref.current = nav;
  const selRef = useRef<Voucher | undefined>();
  selRef.current = vs[nav.sel];

  useEffect(() => {
    props.register({
      id: 'register',
      onKey: (k) => {
        if (k === 'Esc') { pop(); return true; }
        const v = selRef.current;
        if (k === 'Alt+2' && v) {
          const err = mutate((c) => { duplicateVoucher(c, v.id); });
          setHint(err ?? `Voucher ${v.type} ${v.number} duplicated`);
          return true;
        }
        return ref.current.onKey(k);
      },
    });
    return () => props.register(null);
  }, []);

  void postedVouchers;
  return <TallyList title={`Day Book - ${company.name}`} items={items} sel={nav.sel} typed={nav.typed} onPick={nav.setSel} wide />;
}
