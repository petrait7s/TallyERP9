import { defaultGroups } from './groups';
import type { Company, Config, Entry, Features, Ledger, Voucher, VoucherKind, VoucherType } from './types';
import { checkVoucherRules, validateBills } from './vouchers';

export function defaultVoucherTypes(): VoucherType[] {
  const k = (kind: VoucherKind, nonAccounting = false): VoucherType => ({ name: kind, kind, nonAccounting });
  return [
    k('Contra'), k('Payment'), k('Receipt'), k('Journal'), k('Sales'), k('Purchase'),
    k('Credit Note'), k('Debit Note'), k('Memorandum', true), k('Reversing Journal', true),
  ];
}

export const DATA_VERSION = 1;

export function allFeatures(on = true): Features {
  return { inventory: on, billWise: on, costCentres: on, interest: on, budgets: on, multiCurrency: on, bankRecon: on, optionalVouchers: on, vatTds: on, payroll: on };
}

export function defaultConfig(): Config {
  return { singleEntry: true, showNarration: true, showChequeNo: false, allowPostDated: false, reportDetailed: false };
}

export function createCompany(name: string, fyStart: string, fyEnd: string, currency = 'BDT', features: Features = allFeatures()): Company {
  return {
    version: DATA_VERSION,
    features,
    config: defaultConfig(),
    name, fyStart, fyEnd, currency,
    groups: defaultGroups(),
    ledgers: [
      { name: 'Cash', group: 'Cash-in-hand', opening: 0 },
      { name: 'Profit & Loss A/c', group: 'Capital Account', opening: 0 },
    ],
    voucherTypes: defaultVoucherTypes(),
    costCategories: ['Primary Cost Category'],
    costCentres: [],
    currencies: [{ name: currency, symbol: currency === 'BDT' ? '৳' : currency, rate: 10000 }],
    units: [],
    stockGroups: [],
    stockItems: [],
    godowns: [{ name: 'Main Location', parent: null }],
    vouchers: [],
    nextId: 1,
  };
}

export class AccountingError extends Error {}

export function addLedger(c: Company, l: Ledger): void {
  if (c.ledgers.some((x) => x.name.toLowerCase() === l.name.toLowerCase()))
    throw new AccountingError(`Ledger already exists: ${l.name}`);
  if (!c.groups.some((g) => g.name === l.group)) throw new AccountingError(`Unknown group: ${l.group}`);
  c.ledgers.push({ ...l });
}

export function validateEntries(c: Company, entries: Entry[], nonAccounting = false, kind?: VoucherKind, excludeId?: number): void {
  if (entries.length < 2) throw new AccountingError('Voucher needs at least two entries');
  const names = new Set(c.ledgers.map((l) => l.name));
  for (const e of entries) {
    if (!names.has(e.ledger)) throw new AccountingError(`Unknown ledger: ${e.ledger}`);
    if (!Number.isInteger(e.amount)) throw new AccountingError('Amount must be integer paisa');
    if (e.amount === 0) throw new AccountingError(`Zero amount for ${e.ledger}`);
    for (const cc of e.costCentres ?? []) {
      if (!c.costCentres.some((x) => x.name === cc.costCentre))
        throw new AccountingError(`Unknown cost centre: ${cc.costCentre}`);
    }
    if (e.costCentres?.length) {
      const sum = e.costCentres.reduce((s, x) => s + x.amount, 0);
      if (sum !== Math.abs(e.amount)) throw new AccountingError(`Cost centre split of ${e.ledger} != amount`);
    }
    if (e.bills?.length) {
      const sum = e.bills.reduce((s, x) => s + x.amount, 0);
      if (sum !== Math.abs(e.amount)) throw new AccountingError(`Bill allocation of ${e.ledger} != amount`);
    }
  }
  const total = entries.reduce((s, e) => s + e.amount, 0);
  if (total !== 0) throw new AccountingError(`Voucher not balanced (diff ${total} paisa)`);
  void nonAccounting;
  if (kind) checkVoucherRules(c, kind, entries);
  if (!c.features.costCentres && entries.some((e) => e.costCentres?.length)) throw new AccountingError('Cost centres are not enabled (F11 Features)');
  if (!c.features.billWise && entries.some((e) => e.bills?.some((b) => b.method !== 'On Account'))) throw new AccountingError('Bill-wise details are not enabled (F11 Features)');
  validateBills(c, entries, excludeId);
}

export function nextVoucherNumber(c: Company, type: string): string {
  const n = c.vouchers.filter((v) => v.type === type).reduce((m, v) => Math.max(m, Number(v.number) || 0), 0);
  return String(n + 1);
}

export interface NewVoucher {
  type: string;
  date: string;
  entries: Entry[];
  narration?: string;
  optional?: boolean;
  postDated?: boolean;
  chequeNo?: string;
  reverseOn?: string;
  number?: string;
}

export function addVoucher(c: Company, nv: NewVoucher): Voucher {
  const vt = c.voucherTypes.find((t) => t.name === nv.type);
  if (!vt) throw new AccountingError(`Unknown voucher type: ${nv.type}`);
  if (nv.date < c.fyStart || nv.date > c.fyEnd) throw new AccountingError('Date outside financial year');
  validateEntries(c, nv.entries, vt.nonAccounting, vt.kind);
  const v: Voucher = {
    id: c.nextId++,
    type: nv.type,
    number: nv.number ?? nextVoucherNumber(c, nv.type),
    date: nv.date,
    entries: nv.entries.map((e) => ({ ...e })),
    narration: nv.narration,
    optional: nv.optional,
    postDated: nv.postDated,
    chequeNo: nv.chequeNo,
    reverseOn: nv.reverseOn,
  };
  c.vouchers.push(v);
  return v;
}

export function alterVoucher(c: Company, id: number, patch: Partial<Pick<Voucher, 'date' | 'entries' | 'narration' | 'optional' | 'postDated' | 'chequeNo'>>): Voucher {
  const v = c.vouchers.find((x) => x.id === id);
  if (!v) throw new AccountingError(`No voucher ${id}`);
  const vt = c.voucherTypes.find((t) => t.name === v.type)!;
  const entries = patch.entries ?? v.entries;
  validateEntries(c, entries, vt.nonAccounting, vt.kind, id);
  Object.assign(v, patch, { entries: entries.map((e) => ({ ...e })) });
  return v;
}

export function cancelVoucher(c: Company, id: number): void {
  const v = c.vouchers.find((x) => x.id === id);
  if (!v) throw new AccountingError(`No voucher ${id}`);
  v.cancelled = true;
}

export function deleteVoucher(c: Company, id: number): void {
  const i = c.vouchers.findIndex((x) => x.id === id);
  if (i < 0) throw new AccountingError(`No voucher ${id}`);
  c.vouchers.splice(i, 1);
}

export function duplicateVoucher(c: Company, id: number, date?: string): Voucher {
  const v = c.vouchers.find((x) => x.id === id);
  if (!v) throw new AccountingError(`No voucher ${id}`);
  return addVoucher(c, { type: v.type, date: date ?? v.date, entries: v.entries, narration: v.narration });
}
