import * as E from '../engine';
import type { Company } from '../engine';
import { parseTallyDate } from './dates';
import type { AskField } from './reports/modules';

/** One-shot module actions (post payroll, depreciation, fund transfer, ...). run() mutates a copy of the company. */
export interface Action { title: string; fields: AskField[]; run: (c: Company, v: Record<string, string>) => string }

const date = (c: Company, t: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(t.trim())) return t.trim();
  const d = parseTallyDate(t, c.fyEnd, { from: c.fyStart, to: c.fyEnd });
  if (!d) throw new Error(`Invalid date: ${t}`);
  return d;
};
const amount = (t: string) => E.toPaisa(t);
const D = (label = 'Date'): AskField => ({ key: 'date', label, def: (c) => c.fyEnd, hint: '31-3-2026' });

export const ACTIONS: Record<string, Action> = {
  payroll: { title: 'Post Payroll Voucher', fields: [{ key: 'month', label: 'Month (yyyy-mm)', def: (c) => c.fyStart.slice(0, 7) }], run: (c, v) => { const x = E.postPayroll(c, v.month); return `Payroll ${v.month} posted (Journal ${x.number})`; } },
  depreciation: { title: 'Run Depreciation', fields: [D('Depreciate up to')], run: (c, v) => { const x = E.depreciationRun(c, date(c, v.date)); return `Depreciation posted (Journal ${x.number})`; } },
  fundTransfer: {
    title: 'Inter-fund Transfer',
    fields: [D(), { key: 'from', label: 'From fund ledger', def: () => 'General Fund' }, { key: 'to', label: 'To fund ledger', def: () => 'Designated Fund - Emergency' }, { key: 'amount', label: 'Amount', def: () => '10000' }],
    run: (c, v) => { const x = E.fundTransfer(c, date(c, v.date), v.from, v.to, amount(v.amount)); return `Transfer posted (Journal ${x.number})`; },
  },
  restrictUnspent: { title: 'Move Unspent Grant to Restricted Fund', fields: [{ key: 'grant', label: 'Grant ID', def: (c) => E.rows(c, 'grants')[0]?.id ?? '' }, D()], run: (c, v) => { const x = E.restrictUnspent(c, v.grant, date(c, v.date)); return `Unspent balance restricted (Journal ${x.number})`; } },
  refundGrant: { title: 'Refund Unspent Grant', fields: [{ key: 'grant', label: 'Grant ID', def: () => 'G4' }, D(), { key: 'bank', label: 'Bank ledger', def: () => 'Islami Bank A/c' }], run: (c, v) => { const x = E.refundGrant(c, v.grant, date(c, v.date), v.bank); return `Refund posted (Payment ${x.number})`; } },
  replenish: { title: 'Replenish Imprest', fields: [{ key: 'id', label: 'Imprest ID', def: () => 'IM1' }, D(), { key: 'bank', label: 'Bank ledger', def: () => 'Islami Bank A/c' }], run: (c, v) => { const x = E.replenishImprest(c, v.id, date(c, v.date), v.bank); return `Imprest replenished (Contra ${x.number})`; } },
  fdrAccrual: { title: 'Post FDR Interest Accrual', fields: [D('Accrue up to')], run: (c, v) => { const x = E.postFdrAccrual(c, date(c, v.date)); return `Interest accrued (Journal ${x.number})`; } },
  disposeAsset: { title: 'Dispose Fixed Asset', fields: [{ key: 'id', label: 'Asset ID', def: () => 'FA06' }, D(), { key: 'proceeds', label: 'Sale proceeds', def: () => '0' }, { key: 'bank', label: 'Bank ledger', def: () => 'Islami Bank A/c' }], run: (c, v) => { const x = E.disposeAsset(c, v.id, date(c, v.date), amount(v.proceeds), v.bank); return `Asset disposed (Journal ${x.number})`; } },
  fxReceipt: {
    title: 'Foreign Currency Receipt',
    fields: [D(), { key: 'bank', label: 'FC bank ledger', def: () => 'Dutch-Bangla FC A/c' }, { key: 'income', label: 'Income ledger', def: () => 'Foreign Donations' }, { key: 'amount', label: 'Foreign amount', def: () => '1000' }, { key: 'cur', label: 'Currency', def: () => 'USD' }, { key: 'rate', label: 'Rate (BDT)', def: () => '122.5' }],
    run: (c, v) => { const x = E.fxReceipt(c, date(c, v.date), v.bank, v.income, Number(v.amount), v.cur, Number(v.rate)); return `FC receipt booked (Receipt ${x.number})`; },
  },
  xmlImport: {
    title: 'Import Ledgers from XML (simulated)',
    fields: [{ key: 'xml', label: 'Paste XML text', def: () => '', hint: '<LEDGER NAME="..." PARENT="..." OPENING="0"/>' }],
    run: (c, v) => `${E.importLedgersXml(c, v.xml)} ledger(s) imported`,
  },
  vault: { title: 'Set Tally Vault Password', fields: [{ key: 'pw', label: 'New password (blank = none)', def: (c) => c.meta.vault ?? '' }], run: (c, v) => { c.meta.vault = v.pw || undefined; return v.pw ? 'Vault password set' : 'Vault password removed'; } },
};
