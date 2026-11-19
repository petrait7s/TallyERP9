import { groupPath, isUnder } from './groups';
import type { Company, Period, Voucher } from './types';
import type { Paisa } from './money';

/** Vouchers that affect books within the period. */
export function postedVouchers(c: Company, p?: Period, opts: { withOptional?: boolean } = {}): Voucher[] {
  return c.vouchers.filter((v) => {
    if (v.cancelled) return false;
    if (v.postDated) return false;
    if (v.optional && !opts.withOptional) return false;
    const vt = c.voucherTypes.find((t) => t.name === v.type);
    if (vt?.nonAccounting) return false;
    if (p && (v.date < p.from || v.date > p.to)) return false;
    return true;
  });
}

/** Signed balance (+Dr/-Cr) of a ledger: opening + movements up to `to`. */
export function ledgerBalance(c: Company, name: string, to?: string): Paisa {
  const l = c.ledgers.find((x) => x.name === name);
  if (!l) throw new Error(`Unknown ledger ${name}`);
  let bal = l.opening;
  for (const v of postedVouchers(c)) {
    if (to && v.date > to) continue;
    for (const e of v.entries) if (e.ledger === name) bal += e.amount;
  }
  return bal;
}

/** Movement only (no opening) within period. */
export function ledgerMovement(c: Company, name: string, p: Period): { dr: Paisa; cr: Paisa } {
  let dr = 0, cr = 0;
  for (const v of postedVouchers(c, p))
    for (const e of v.entries) {
      if (e.ledger !== name) continue;
      if (e.amount > 0) dr += e.amount;
      else cr += -e.amount;
    }
  return { dr, cr };
}

export interface TBRow { ledger: string; group: string; debit: Paisa; credit: Paisa }
export interface TrialBalance { rows: TBRow[]; totalDebit: Paisa; totalCredit: Paisa; balanced: boolean }

/** Closing-balance trial balance as on `to`. */
export function trialBalance(c: Company, to: string = c.fyEnd): TrialBalance {
  const rows: TBRow[] = [];
  for (const l of c.ledgers) {
    const b = ledgerBalance(c, l.name, to);
    if (b === 0) continue;
    rows.push({ ledger: l.name, group: l.group, debit: b > 0 ? b : 0, credit: b < 0 ? -b : 0 });
  }
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  return { rows, totalDebit, totalCredit, balanced: totalDebit === totalCredit };
}

/** Signed balance of a group (incl. sub-groups) as on `to`. */
export function groupBalance(c: Company, group: string, to?: string): Paisa {
  return c.ledgers
    .filter((l) => isUnder(c.groups, l.group, group))
    .reduce((s, l) => s + ledgerBalance(c, l.name, to), 0);
}

function natureOf(c: Company, ledgerGroup: string) {
  const prim = groupPath(c.groups, ledgerGroup)[0];
  return c.groups.find((g) => g.name === prim)!.nature;
}

export interface Line { name: string; amount: Paisa }
export interface IncomeExpenditure {
  expenditure: Line[]; income: Line[];
  totalExpenditure: Paisa; totalIncome: Paisa;
  /** +ve surplus, -ve deficit */
  surplus: Paisa;
}

/**
 * Income & Expenditure (accrual) for a period. Opening balances of nominal
 * ledgers are ignored (period flow only), as in Tally for a fresh FY.
 */
export function incomeExpenditure(c: Company, p: Period = { from: c.fyStart, to: c.fyEnd }): IncomeExpenditure {
  const expenditure: Line[] = [];
  const income: Line[] = [];
  for (const l of c.ledgers) {
    const nat = natureOf(c, l.group);
    if (nat !== 'income' && nat !== 'expense') continue;
    const { dr, cr } = ledgerMovement(c, l.name, p);
    const net = dr - cr;
    if (net === 0) continue;
    if (nat === 'expense') expenditure.push({ name: l.name, amount: net });
    else income.push({ name: l.name, amount: -net });
  }
  const totalExpenditure = expenditure.reduce((s, x) => s + x.amount, 0);
  const totalIncome = income.reduce((s, x) => s + x.amount, 0);
  return { expenditure, income, totalExpenditure, totalIncome, surplus: totalIncome - totalExpenditure };
}

export interface BalanceSheet {
  liabilities: Line[]; assets: Line[];
  totalLiabilities: Paisa; totalAssets: Paisa; balanced: boolean;
}

/** NGO Balance Sheet: surplus/deficit of the period is added to Capital Fund. */
export function balanceSheet(c: Company, to: string = c.fyEnd): BalanceSheet {
  const liabilities: Line[] = [];
  const assets: Line[] = [];
  const ie = incomeExpenditure(c, { from: c.fyStart, to });
  for (const l of c.ledgers) {
    const nat = natureOf(c, l.group);
    if (nat === 'income' || nat === 'expense') continue;
    const b = ledgerBalance(c, l.name, to);
    if (b === 0) continue;
    // Accounts with contrary balance appear on the opposite side (as Tally does).
    if (b > 0) assets.push({ name: l.name, amount: b });
    else liabilities.push({ name: l.name, amount: -b });
  }
  // Opening balances on nominal ledgers carried as prior-year result (rare); include for integrity.
  let nominalOpening = 0;
  for (const l of c.ledgers) {
    const nat = natureOf(c, l.group);
    if (nat === 'income' || nat === 'expense') nominalOpening += l.opening;
  }
  const resultCr = ie.surplus - nominalOpening; // credit-positive = surplus
  if (resultCr !== 0) {
    if (resultCr > 0) liabilities.push({ name: 'Income & Expenditure A/c (Surplus)', amount: resultCr });
    else assets.push({ name: 'Income & Expenditure A/c (Deficit)', amount: -resultCr });
  }
  const totalLiabilities = liabilities.reduce((s, x) => s + x.amount, 0);
  const totalAssets = assets.reduce((s, x) => s + x.amount, 0);
  return { liabilities, assets, totalLiabilities, totalAssets, balanced: totalLiabilities === totalAssets };
}

export interface RPStatement {
  receipts: Line[]; payments: Line[];
  openingCashBank: Paisa; closingCashBank: Paisa;
  totalReceipts: Paisa; totalPayments: Paisa;
}

/**
 * Receipts & Payments (cash basis): every voucher touching Cash-in-hand / Bank Accounts;
 * the counter-ledgers are listed as receipts (cash in) or payments (cash out).
 */
export function receiptsPayments(c: Company, p: Period = { from: c.fyStart, to: c.fyEnd }): RPStatement {
  const isCashBank = (name: string) => {
    const l = c.ledgers.find((x) => x.name === name)!;
    return isUnder(c.groups, l.group, 'Cash-in-hand') || isUnder(c.groups, l.group, 'Bank Accounts');
  };
  const rec = new Map<string, Paisa>();
  const pay = new Map<string, Paisa>();
  for (const v of postedVouchers(c, p)) {
    const cb = v.entries.filter((e) => isCashBank(e.ledger));
    const others = v.entries.filter((e) => !isCashBank(e.ledger));
    if (!cb.length) continue;
    // Contra (cash<->bank only): no external flow.
    if (!others.length) continue;
    const net = cb.reduce((s, e) => s + e.amount, 0);
    if (net === 0) continue;
    for (const o of others) {
      if (net > 0 && o.amount < 0) rec.set(o.ledger, (rec.get(o.ledger) ?? 0) - o.amount);
      else if (net < 0 && o.amount > 0) pay.set(o.ledger, (pay.get(o.ledger) ?? 0) + o.amount);
    }
  }
  let opening = 0, closing = 0;
  for (const l of c.ledgers) {
    if (!isCashBank(l.name)) continue;
    opening += ledgerBalance(c, l.name, dayBefore(p.from));
    closing += ledgerBalance(c, l.name, p.to);
  }
  const receipts = [...rec].map(([name, amount]) => ({ name, amount }));
  const payments = [...pay].map(([name, amount]) => ({ name, amount }));
  return {
    receipts, payments, openingCashBank: opening, closingCashBank: closing,
    totalReceipts: receipts.reduce((s, x) => s + x.amount, 0),
    totalPayments: payments.reduce((s, x) => s + x.amount, 0),
  };
}

export function dayBefore(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export interface LedgerRow {
  date: string; particulars: string; voucherType: string; voucherNo: string;
  debit: Paisa; credit: Paisa; voucherId: number;
}

/** Ledger account with "To"/"By" particulars (counter-party shown). */
export function ledgerAccount(c: Company, name: string, p: Period): { opening: Paisa; rows: LedgerRow[]; closing: Paisa } {
  const opening = ledgerBalance(c, name, dayBefore(p.from));
  const rows: LedgerRow[] = [];
  for (const v of postedVouchers(c, p).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)) {
    for (const e of v.entries.filter((x) => x.ledger === name)) {
      const others = v.entries.filter((x) => x !== e && Math.sign(x.amount) !== Math.sign(e.amount));
      const cp = others[0]?.ledger ?? '';
      const label = others.length > 1 ? '(as per details)' : cp;
      rows.push({
        date: v.date,
        particulars: `${e.amount > 0 ? 'To' : 'By'} ${label}`,
        voucherType: v.type, voucherNo: v.number,
        debit: e.amount > 0 ? e.amount : 0, credit: e.amount < 0 ? -e.amount : 0, voucherId: v.id,
      });
    }
  }
  const closing = opening + rows.reduce((s, r) => s + r.debit - r.credit, 0);
  return { opening, rows, closing };
}

export function dayBook(c: Company, p: Period): Voucher[] {
  return c.vouchers
    .filter((v) => v.date >= p.from && v.date <= p.to)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
}

/** Cost-centre (project/donor/fund) statement: income and expense by ledger. */
export function costCentreStatement(c: Company, centre: string, p: Period) {
  const lines = new Map<string, Paisa>();
  for (const v of postedVouchers(c, p))
    for (const e of v.entries)
      for (const a of e.costCentres ?? [])
        if (a.costCentre === centre)
          lines.set(e.ledger, (lines.get(e.ledger) ?? 0) + Math.sign(e.amount) * a.amount);
  const rows = [...lines].map(([ledger, net]) => ({ ledger, net }));
  return { rows, net: rows.reduce((s, r) => s + r.net, 0) };
}
