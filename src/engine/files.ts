import { allFeatures, defaultConfig, DATA_VERSION } from './company';
import { defaultVoucherTypes } from './company';
import { ledgerBalance, incomeExpenditure, postedVouchers } from './reports';
import { outstandingBills } from './vouchers';
import { groupPath } from './groups';
import type { Company } from './types';

export interface CompanyFile {
  format: 'tallylearn-company';
  version: number;
  id: string;
  savedAt: string;
  company: Company;
}

/** Upgrade older company data to the current shape. Pure; never mutates input. */
export function migrate(raw: any): Company {
  const c = structuredClone(raw);
  const v = typeof c.version === 'number' ? c.version : 0;
  if (v < 1) {
    c.features = { ...allFeatures(true), ...(c.features ?? {}) };
    c.config = { ...defaultConfig(), ...(c.config ?? {}) };
    c.currencies ??= [{ name: c.currency ?? 'BDT', symbol: c.currency === 'BDT' ? '৳' : c.currency ?? 'BDT', rate: 10000 }];
    c.units ??= []; c.stockGroups ??= []; c.stockItems ??= [];
    c.godowns ??= [{ name: 'Main Location', parent: null }];
    c.voucherTypes ??= defaultVoucherTypes();
    c.costCategories ??= ['Primary Cost Category'];
    c.costCentres ??= [];
  }
  c.registers ??= {};
  c.editLog ??= [];
  c.meta ??= {};
  if (v > DATA_VERSION) throw new Error(`Company file is from a newer version (${v})`);
  c.version = DATA_VERSION;
  return c as Company;
}

export function serializeCompany(c: Company, id: string): string {
  const f: CompanyFile = { format: 'tallylearn-company', version: DATA_VERSION, id, savedAt: new Date().toISOString(), company: c };
  return JSON.stringify(f);
}

export function parseCompanyFile(text: string): { id: string; company: Company } {
  let o: any;
  try { o = JSON.parse(text); } catch { throw new Error('Not a valid company file (bad JSON)'); }
  if (o?.format !== 'tallylearn-company' || !o.company) throw new Error('Not a TallyLearn company file');
  const company = migrate({ ...o.company, version: o.company.version ?? o.version ?? 0 });
  if (!Array.isArray(company.ledgers) || !Array.isArray(company.vouchers) || !Array.isArray(company.groups)) throw new Error('Company file is incomplete');
  return { id: String(o.id ?? ''), company };
}

/** Data Repair: scan for problems. Returns human-readable issues (empty = healthy). */
export function checkIntegrity(c: Company): string[] {
  const out: string[] = [];
  const ledgers = new Set(c.ledgers.map((l) => l.name));
  const groups = new Set(c.groups.map((g) => g.name));
  const centres = new Set(c.costCentres.map((x) => x.name));
  for (const l of c.ledgers) {
    if (!groups.has(l.group)) out.push(`Ledger "${l.name}" is under unknown group "${l.group}"`);
    else try { groupPath(c.groups, l.group); } catch { out.push(`Group cycle above ledger "${l.name}"`); }
  }
  for (const v of c.vouchers) {
    const tag = `${v.type} ${v.number} (${v.date})`;
    if (v.date < c.fyStart || v.date > c.fyEnd) out.push(`${tag}: date outside financial year`);
    const sum = v.entries.reduce((s, e) => s + e.amount, 0);
    if (sum !== 0) out.push(`${tag}: not balanced (diff ${sum} paisa)`);
    for (const e of v.entries) {
      if (!ledgers.has(e.ledger)) out.push(`${tag}: unknown ledger "${e.ledger}"`);
      for (const a of e.costCentres ?? []) if (!centres.has(a.costCentre)) out.push(`${tag}: unknown cost centre "${a.costCentre}"`);
    }
  }
  const dup = new Map<string, number>();
  for (const v of c.vouchers) dup.set(`${v.type}|${v.number}`, (dup.get(`${v.type}|${v.number}`) ?? 0) + 1);
  for (const [k, n] of dup) if (n > 1) out.push(`Duplicate voucher number ${k.replace('|', ' ')} (${n} times)`);
  const openingSum = c.ledgers.reduce((s, l) => s + l.opening, 0);
  if (openingSum !== 0) out.push(`Opening balances differ by ${openingSum} paisa`);
  return out;
}

/**
 * Split / year-end carry-forward: new company for the next period with closing balances as openings.
 * Nominal (income/expense) results move to "Profit & Loss A/c" as Cr(surplus)/Dr(deficit).
 */
export function carryForward(c: Company, newName: string, fyStart: string, fyEnd: string): Company {
  const to = c.fyEnd;
  const nat = (g: string) => c.groups.find((x) => x.name === groupPath(c.groups, g)[0])!.nature;
  const next: Company = structuredClone(c);
  next.name = newName;
  next.fyStart = fyStart;
  next.fyEnd = fyEnd;
  next.vouchers = [];
  next.nextId = 1;
  const ie = incomeExpenditure(c, { from: c.fyStart, to });
  let nominalOpening = 0;
  for (const l of next.ledgers) {
    const n = nat(l.group);
    const closing = ledgerBalance(c, l.name, to);
    if (n === 'income' || n === 'expense') { nominalOpening += l.opening; l.opening = 0; }
    else l.opening = closing;
    l.openingBills = outstandingBills(c, l.name, { asOn: to }).map((b) => ({ ref: b.ref, amount: b.pending, date: b.date }));
    if (!l.openingBills.length) delete l.openingBills;
  }
  const pl = next.ledgers.find((l) => l.name === 'Profit & Loss A/c');
  if (pl) pl.opening += -(ie.surplus - nominalOpening);
  // any non-posting data (optional/post-dated) is dropped with the vouchers
  void postedVouchers;
  return next;
}
