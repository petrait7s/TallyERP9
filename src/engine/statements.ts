import { groupPath, isUnder } from './groups';
import type { Paisa } from './money';
import { incomeExpenditure, ledgerBalance, ledgerMovement, dayBefore, postedVouchers } from './reports';
import { outstandingBills } from './vouchers';
import type { Company, Group, Ledger, Period } from './types';

export interface SummaryRow {
  kind: 'group' | 'ledger';
  name: string;
  /** signed (+Dr / -Cr) */
  opening: Paisa;
  debit: Paisa;
  credit: Paisa;
  /** signed */
  closing: Paisa;
}

/** Direct children of a group (null = primary groups). */
export function groupChildren(c: Company, group: string | null): { groups: Group[]; ledgers: Ledger[] } {
  return {
    groups: c.groups.filter((g) => g.parent === group),
    ledgers: group === null ? [] : c.ledgers.filter((l) => l.group === group),
  };
}

/** Opening/Debit/Credit/Closing of a group (incl. sub-groups) over the period. */
export function groupFigures(c: Company, group: string, p: Period) {
  let opening = 0, debit = 0, credit = 0;
  for (const l of c.ledgers) {
    if (!isUnder(c.groups, l.group, group)) continue;
    opening += ledgerBalance(c, l.name, dayBefore(p.from));
    const m = ledgerMovement(c, l.name, p);
    debit += m.dr;
    credit += m.cr;
  }
  return { opening, debit, credit, closing: opening + debit - credit };
}

export function groupSummary(c: Company, group: string | null, p: Period): SummaryRow[] {
  const { groups, ledgers } = groupChildren(c, group);
  const rows: SummaryRow[] = [];
  for (const g of groups) rows.push({ kind: 'group', name: g.name, ...groupFigures(c, g.name, p) });
  for (const l of ledgers) {
    const m = ledgerMovement(c, l.name, p);
    const opening = ledgerBalance(c, l.name, dayBefore(p.from));
    rows.push({ kind: 'ledger', name: l.name, opening, debit: m.dr, credit: m.cr, closing: opening + m.dr - m.cr });
  }
  return rows.filter((r) => r.opening !== 0 || r.debit !== 0 || r.credit !== 0 || r.closing !== 0);
}

export interface GLine { name: string; amount: Paisa; kind: 'group' | 'result' | 'diff' }

export interface BalanceSheetGroups {
  liabilities: GLine[]; assets: GLine[];
  totalLiabilities: Paisa; totalAssets: Paisa; balanced: boolean;
}

/** Group-level NGO Balance Sheet; period result is shown as "Income & Expenditure A/c". */
export function balanceSheetGroups(c: Company, to: string = c.fyEnd): BalanceSheetGroups {
  const liabilities: GLine[] = [];
  const assets: GLine[] = [];
  let nominalOpening = 0;
  for (const g of c.groups.filter((x) => x.parent === null)) {
    if (g.nature === 'income' || g.nature === 'expense') {
      for (const l of c.ledgers) if (isUnder(c.groups, l.group, g.name)) nominalOpening += l.opening;
      continue;
    }
    let bal = 0;
    for (const l of c.ledgers) if (isUnder(c.groups, l.group, g.name)) bal += ledgerBalance(c, l.name, to);
    if (bal > 0) assets.push({ name: g.name, amount: bal, kind: 'group' });
    else if (bal < 0) liabilities.push({ name: g.name, amount: -bal, kind: 'group' });
  }
  const ie = incomeExpenditure(c, { from: c.fyStart, to });
  const resultCr = ie.surplus - nominalOpening;
  if (resultCr > 0) liabilities.unshift({ name: 'Income & Expenditure A/c', amount: resultCr, kind: 'result' });
  else if (resultCr < 0) assets.push({ name: 'Income & Expenditure A/c (Deficit)', amount: -resultCr, kind: 'result' });
  // Tally shows any imbalance in opening balances as "Difference in Opening Balances".
  const openingSum = c.ledgers.reduce((s, l) => s + l.opening, 0);
  if (openingSum > 0) liabilities.push({ name: 'Difference in Opening Balances', amount: openingSum, kind: 'diff' });
  else if (openingSum < 0) assets.push({ name: 'Difference in Opening Balances', amount: -openingSum, kind: 'diff' });
  const totalLiabilities = liabilities.reduce((s, x) => s + x.amount, 0);
  const totalAssets = assets.reduce((s, x) => s + x.amount, 0);
  return { liabilities, assets, totalLiabilities, totalAssets, balanced: totalLiabilities === totalAssets };
}

export interface IEGroups {
  expenditure: GLine[]; income: GLine[];
  totalExpenditure: Paisa; totalIncome: Paisa; surplus: Paisa;
}

export function ieGroups(c: Company, p: Period = { from: c.fyStart, to: c.fyEnd }): IEGroups {
  const expenditure: GLine[] = [];
  const income: GLine[] = [];
  for (const g of c.groups.filter((x) => x.parent === null)) {
    if (g.nature !== 'income' && g.nature !== 'expense') continue;
    const f = groupFigures(c, g.name, p);
    const net = f.debit - f.credit;
    if (net === 0) continue;
    if (g.nature === 'expense') expenditure.push({ name: g.name, amount: net, kind: 'group' });
    else income.push({ name: g.name, amount: -net, kind: 'group' });
  }
  const totalExpenditure = expenditure.reduce((s, x) => s + x.amount, 0);
  const totalIncome = income.reduce((s, x) => s + x.amount, 0);
  return { expenditure, income, totalExpenditure, totalIncome, surplus: totalIncome - totalExpenditure };
}

export interface AgeBuckets { b0: Paisa; b30: Paisa; b60: Paisa; b90: Paisa }
export interface OutstandingBill { ref: string; date: string; pending: Paisa; days: number; buckets: AgeBuckets }
export interface OutstandingParty { party: string; total: Paisa; buckets: AgeBuckets; bills: OutstandingBill[]; onAccount: Paisa }

const zero = (): AgeBuckets => ({ b0: 0, b30: 0, b60: 0, b90: 0 });
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

/** Bill-wise outstandings with ageing (0-30 / 31-60 / 61-90 / 90+ days). Amounts are positive in the group's natural side. */
export function outstandingsReport(c: Company, group: string, asOn: string): OutstandingParty[] {
  const sign = c.groups.find((g) => g.name === groupPath(c.groups, group)[0])!.nature === 'asset' ? 1 : -1;
  const out: OutstandingParty[] = [];
  for (const l of c.ledgers) {
    if (!isUnder(c.groups, l.group, group)) continue;
    const bills = outstandingBills(c, l.name, { asOn }).map((b): OutstandingBill => {
      const days = Math.max(0, daysBetween(b.date, asOn));
      const amt = b.pending * sign;
      const buckets = zero();
      if (days <= 30) buckets.b0 = amt; else if (days <= 60) buckets.b30 = amt; else if (days <= 90) buckets.b60 = amt; else buckets.b90 = amt;
      return { ref: b.ref, date: b.date, pending: amt, days, buckets };
    }).sort((a, b) => a.date.localeCompare(b.date));
    const billTotal = bills.reduce((s, b) => s + b.pending, 0);
    const onAccount = ledgerBalance(c, l.name, asOn) * sign - billTotal;
    if (!bills.length && onAccount === 0) continue;
    const buckets = zero();
    for (const b of bills) { buckets.b0 += b.buckets.b0; buckets.b30 += b.buckets.b30; buckets.b60 += b.buckets.b60; buckets.b90 += b.buckets.b90; }
    out.push({ party: l.name, total: billTotal + onAccount, buckets, bills, onAccount });
  }
  return out;
}

export interface CentreRow { centre: string; category: string; income: Paisa; expense: Paisa }

/** Fund/Project/Donor summary by cost centre: income = Cr to income ledgers, expense = Dr to expense ledgers. */
export function costCentreSummary(c: Company, p: Period, category?: string): CentreRow[] {
  const nat = (name: string) => {
    const l = c.ledgers.find((x) => x.name === name)!;
    return c.groups.find((g) => g.name === groupPath(c.groups, l.group)[0])!.nature;
  };
  const map = new Map<string, CentreRow>();
  for (const cc of c.costCentres) if (!category || cc.category === category) map.set(cc.name, { centre: cc.name, category: cc.category, income: 0, expense: 0 });
  for (const v of postedVouchers(c, p))
    for (const e of v.entries)
      for (const a of e.costCentres ?? []) {
        const row = map.get(a.costCentre);
        if (!row) continue;
        const n = nat(e.ledger);
        if (n === 'income') row.income += e.amount < 0 ? a.amount : -a.amount;
        else if (n === 'expense') row.expense += e.amount > 0 ? a.amount : -a.amount;
      }
  return [...map.values()];
}

export interface FundRow { fund: string; opening: Paisa; additions: Paisa; utilised: Paisa; closing: Paisa }

/** Fund statement: balances of fund groups (Cr positive). Utilised = Dr movements. */
export function fundStatement(c: Company, p: Period): FundRow[] {
  return c.groups.filter((g) => g.isFund || g.name === 'Restricted Funds').map((g) => {
    const f = groupFigures(c, g.name, p);
    return { fund: g.name, opening: -f.opening, additions: f.credit, utilised: f.debit, closing: -f.closing };
  }).filter((r) => r.opening || r.additions || r.utilised || r.closing);
}

export interface Ratio { name: string; value: string }

export function ratios(c: Company, to: string = c.fyEnd): Ratio[] {
  const p = { from: c.fyStart, to };
  const bal = (g: string) => groupFigures(c, g, { from: c.fyStart, to }).closing;
  const ca = bal('Current Assets');
  const cl = -bal('Current Liabilities');
  const cash = bal('Cash-in-hand') + bal('Bank Accounts');
  const fa = bal('Fixed Assets');
  const bs = balanceSheetGroups(c, to);
  const ie = ieGroups(c, p);
  const r = (a: number, b: number, suffix = '') => (b === 0 ? '-' : `${(a / b).toFixed(2)}${suffix}`);
  const pct = (a: number, b: number) => (b === 0 ? '-' : `${((a / b) * 100).toFixed(2)} %`);
  return [
    { name: 'Current Ratio (Current Assets : Current Liabilities)', value: r(ca, cl, ' : 1') },
    { name: 'Liquid Ratio (Cash & Bank : Current Liabilities)', value: r(cash, cl, ' : 1') },
    { name: 'Working Capital (Current Assets - Current Liabilities)', value: String((ca - cl) / 100) },
    { name: 'Fixed Assets to Total Assets', value: pct(fa, bs.totalAssets) },
    { name: 'Expenditure to Income', value: pct(ie.totalExpenditure, ie.totalIncome) },
    { name: 'Surplus Margin (Surplus / Income)', value: pct(ie.surplus, ie.totalIncome) },
  ];
}

export interface StockRow { item: string; unit: string; qty: number; rate: Paisa; value: Paisa }

/** Opening stock summary (stock vouchers arrive later, so closing = opening for now). */
export function stockSummary(c: Company): StockRow[] {
  return c.stockItems.map((i) => ({ item: i.name, unit: i.unit, qty: i.openingQty, rate: i.openingRate, value: i.openingQty * i.openingRate }));
}

