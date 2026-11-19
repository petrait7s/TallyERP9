import type { Paisa } from './money';
import { postedVouchers } from './reports';
import type { Company, Period } from './types';

/** tax = amount x rate (basis points), rounded half up. */
export function taxAmount(amount: Paisa, rateBps: number): Paisa {
  return Math.round((amount * rateBps) / 10000);
}

export interface VatRow { ledger: string; input: Paisa; output: Paisa }
export interface VatSummary { rows: VatRow[]; totalInput: Paisa; totalOutput: Paisa; payable: Paisa }

/** Simulated VAT: output = credits to VAT ledgers, input = debits; payable = output - input. */
export function vatSummary(c: Company, p: Period): VatSummary {
  const names = c.ledgers.filter((l) => l.taxType === 'VAT').map((l) => l.name);
  const map = new Map<string, VatRow>(names.map((n) => [n, { ledger: n, input: 0, output: 0 }]));
  for (const v of postedVouchers(c, p))
    for (const e of v.entries) {
      const r = map.get(e.ledger);
      if (!r) continue;
      if (e.amount > 0) r.input += e.amount; else r.output += -e.amount;
    }
  const rows = [...map.values()];
  const totalInput = rows.reduce((s, r) => s + r.input, 0);
  const totalOutput = rows.reduce((s, r) => s + r.output, 0);
  return { rows, totalInput, totalOutput, payable: totalOutput - totalInput };
}

export interface TdsRow {
  ledger: string;
  deducted: Paisa;
  deposited: Paisa;
  balance: Paisa;
  /** FIFO-unpaid amount whose due date has passed */
  overdue: Paisa;
  /** due date of the oldest unpaid deduction (ISO) or '' */
  nextDue: string;
}

/** Simulated rule: tax deducted in a month is due on the 15th of the following month. */
export function dueDate(deductedOn: string): string {
  const [y, m] = deductedOn.split('-').map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return `${ny}-${String(nm).padStart(2, '0')}-15`;
}

/** TDS/AIT payable with challan (deposit) tracking, matched FIFO. */
export function tdsPayable(c: Company, p: Period, asOn: string): TdsRow[] {
  const out: TdsRow[] = [];
  for (const l of c.ledgers.filter((x) => x.taxType === 'TDS')) {
    const credits: { date: string; amount: Paisa }[] = [];
    let deposited = 0;
    for (const v of postedVouchers(c, { from: '0000-01-01', to: p.to }).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id))
      for (const e of v.entries) {
        if (e.ledger !== l.name) continue;
        if (e.amount < 0) credits.push({ date: v.date, amount: -e.amount }); else deposited += e.amount;
      }
    let left = deposited + Math.max(0, l.opening);
    let overdue = 0, nextDue = '';
    const open = -Math.min(0, l.opening);
    const list = open ? [{ date: c.fyStart, amount: open }, ...credits] : credits;
    for (const cr of list) {
      const used = Math.min(left, cr.amount);
      left -= used;
      const unpaid = cr.amount - used;
      if (unpaid > 0) {
        const d = dueDate(cr.date);
        if (!nextDue) nextDue = d;
        if (d < asOn) overdue += unpaid;
      }
    }
    const inPeriod = credits.filter((x) => x.date >= p.from && x.date <= p.to).reduce((s, x) => s + x.amount, 0);
    const paidInPeriod = postedVouchers(c, p).flatMap((v) => v.entries).filter((e) => e.ledger === l.name && e.amount > 0).reduce((s, e) => s + e.amount, 0);
    out.push({ ledger: l.name, deducted: inPeriod, deposited: paidInPeriod, balance: list.reduce((s, x) => s + x.amount, 0) - deposited - Math.max(0, l.opening), overdue, nextDue });
  }
  return out;
}
