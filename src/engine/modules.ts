import { AccountingError, addVoucher, createCompany } from './company';
import { isUnder, groupPath } from './groups';
import { money, whole, rows, fmtMoney } from './registers';
import { incomeExpenditure, ledgerBalance, ledgerMovement, postedVouchers } from './reports';
import { costCentreSummary, groupFigures, outstandingsReport } from './statements';
import { toPaisa, type Paisa } from './money';
import type { Company, Entry, Period, Row } from './types';

/** Generic report table returned by module functions. kinds: t text, a amount, d date, i integer, p percent (x100) */
export type Kind = 't' | 'a' | 'd' | 'i' | 'p';
export interface Tab {
  title: string; subtitle?: string; columns: string[]; kinds: Kind[]; rows: (string | number)[][];
  /** append a Total row summing amount/integer columns */
  total?: boolean;
  /** first column is a ledger / cost centre / group (enables drill-down) */
  drill?: 'ledger' | 'centre' | 'group';
  note?: string;
}

const FY = (c: Company): Period => ({ from: c.fyStart, to: c.fyEnd });
const lastDay = (month: string): string => { const [y, m] = month.split('-').map(Number); return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); };
const days = (a: string, b: string): number => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
const has = (c: Company, name: string) => c.ledgers.some((l) => l.name === name);
const nature = (c: Company, ledger: string) => {
  const l = c.ledgers.find((x) => x.name === ledger)!;
  return c.groups.find((g) => g.name === groupPath(c.groups, l.group)[0])!.nature;
};
const pctx = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 10000));

// ---------------------------------------------------------------- Payroll (C8, N11)
export interface Slip { id: string; name: string; type: string; gross: Paisa; pf: Paisa; employerPf: Paisa; advance: Paisa; tds: Paisa; net: Paisa; split: [string, number][] }

function parseSplit(text: string): [string, number][] {
  const parts = (text || '').split(';').map((x) => x.trim()).filter(Boolean).map((x) => { const i = x.lastIndexOf(':'); return [x.slice(0, i), Number(x.slice(i + 1))] as [string, number]; });
  const total = parts.reduce((s, p) => s + p[1], 0);
  if (!parts.length || total !== 100) throw new AccountingError(`Salary split must total 100% (${text})`);
  return parts;
}

export function payrollCalc(c: Company, month: string): { slips: Slip[]; entries: Entry[] } {
  const asOn = lastDay(month);
  const slips: Slip[] = [];
  let advBal = has(c, 'Staff Advances') ? ledgerBalance(c, 'Staff Advances', asOn) : 0;
  const agg = new Map<string, { amount: Paisa; centres: Map<string, Paisa> }>();
  const addDr = (ledger: string, amount: Paisa, split: [string, number][]) => {
    if (amount <= 0) return;
    const a = agg.get(ledger) ?? { amount: 0, centres: new Map() };
    a.amount += amount;
    let left = amount;
    split.forEach(([cc, pct], i) => {
      const part = i === split.length - 1 ? left : Math.round((amount * pct) / 100);
      left -= part;
      a.centres.set(cc, (a.centres.get(cc) ?? 0) + part);
    });
    agg.set(ledger, a);
  };
  let netTotal = 0, pfTotal = 0, tdsTotal = 0, advTotal = 0;
  for (const e of rows(c, 'employees')) {
    if (e.joined && e.joined > asOn) continue;
    const basic = money(e, 'basic'), allow = money(e, 'allowance'), gross = basic + allow;
    const split = parseSplit(e.split);
    let pf = 0, employerPf = 0, tds = 0, adv = 0;
    if (e.type === 'Staff') {
      pf = Math.round((basic * whole(e, 'pfPct')) / 100);
      employerPf = pf;
      adv = Math.min(Math.max(advBal, 0), Math.round(money(e, 'advance') / 12));
      advBal -= adv;
      addDr(c.features.costCentres ? 'Salaries' : 'Salaries', gross, split);
      addDr('Employer PF Contribution', employerPf, split);
    } else if (e.type === 'Volunteer') addDr('Volunteer Honorarium', gross, split);
    else { tds = Math.round(gross / 10); addDr('Consultancy Fees', gross, split); }
    const net = gross - pf - adv - tds;
    slips.push({ id: e.id, name: e.name, type: e.type, gross, pf, employerPf, advance: adv, tds, net, split });
    netTotal += net; pfTotal += pf + employerPf; tdsTotal += tds; advTotal += adv;
  }
  const entries: Entry[] = [];
  for (const [ledger, a] of agg) {
    entries.push({ ledger, amount: a.amount, costCentres: c.features.costCentres ? [...a.centres].filter(([, v]) => v > 0).map(([costCentre, amount]) => ({ costCentre, amount })) : undefined });
  }
  if (netTotal) entries.push({ ledger: 'Salary Payable', amount: -netTotal });
  if (pfTotal) entries.push({ ledger: 'PF Payable', amount: -pfTotal });
  if (tdsTotal) entries.push({ ledger: 'TDS Payable', amount: -tdsTotal });
  if (advTotal) entries.push({ ledger: 'Staff Advances', amount: -advTotal });
  return { slips, entries };
}

export function postPayroll(c: Company, month: string) {
  const narration = `Payroll ${month}`;
  if (c.vouchers.some((v) => !v.cancelled && v.narration === narration)) throw new AccountingError(`Payroll for ${month} is already posted`);
  const { entries } = payrollCalc(c, month);
  if (!entries.length) throw new AccountingError('No employees to pay');
  return addVoucher(c, { type: 'Journal', date: lastDay(month), entries, narration });
}

export function payslip(c: Company, empId: string, month: string): Tab {
  const s = payrollCalc(c, month).slips.find((x) => x.id === empId);
  if (!s) throw new AccountingError(`No payslip for ${empId} in ${month}`);
  return {
    title: `Payslip: ${s.name} (${s.id})`, subtitle: `${s.type}, ${month}`, columns: ['Particulars', 'Earnings', 'Deductions'], kinds: ['t', 'a', 'a'],
    rows: [['Gross pay', s.gross, 0], ['Provident fund (employee)', 0, s.pf], ['Advance recovery', 0, s.advance], ['TDS', 0, s.tds], ['Net pay', s.net, 0]],
    note: s.employerPf ? `Employer PF contribution: ${fmtMoney(s.employerPf)}` : undefined,
  };
}

export function payrollRegister(c: Company, month: string): Tab {
  const { slips } = payrollCalc(c, month);
  return { title: 'Payroll Register', subtitle: month, columns: ['Employee', 'Type', 'Gross', 'PF', 'Advance', 'TDS', 'Net pay'], kinds: ['t', 't', 'a', 'a', 'a', 'a', 'a'], rows: slips.map((s) => [s.name, s.type, s.gross, s.pf, s.advance, s.tds, s.net]), total: true };
}

/** Salary cost by cost centre (project payroll cost) from posted vouchers. */
export function projectPayrollCost(c: Company, p: Period): Tab {
  const m = new Map<string, Paisa>();
  const led = ['Salaries', 'Employer PF Contribution', 'Volunteer Honorarium', 'Consultancy Fees'];
  for (const v of postedVouchers(c, p)) for (const e of v.entries) if (led.includes(e.ledger)) for (const a of e.costCentres ?? []) m.set(a.costCentre, (m.get(a.costCentre) ?? 0) + a.amount);
  return { title: 'Project-wise Payroll Cost', subtitle: `${p.from} to ${p.to}`, columns: ['Cost Centre', 'Payroll cost'], kinds: ['t', 'a'], rows: [...m].sort((a, b) => b[1] - a[1]), total: true, drill: 'centre' };
}

// ---------------------------------------------------------------- Funds, donors, grants (N1-N4)
export function fundTransfer(c: Company, date: string, from: string, to: string, amount: Paisa, narration = 'Inter-fund transfer') {
  if (amount <= 0) throw new AccountingError('Amount must be positive');
  return addVoucher(c, { type: 'Journal', date, narration, entries: [{ ledger: from, amount }, { ledger: to, amount: -amount }] });
}

export function fundLedgerStatement(c: Company, p: Period = FY(c)): Tab {
  const r: (string | number)[][] = [];
  for (const l of c.ledgers) {
    const g = c.groups.find((x) => x.name === l.group)!;
    if (!(g.isFund || isUnder(c.groups, l.group, 'Capital Account'))) continue;
    const open = -ledgerBalance(c, l.name, new Date(Date.parse(`${p.from}T00:00:00Z`) - 86400000).toISOString().slice(0, 10));
    const m = ledgerMovement(c, l.name, p);
    const close = -ledgerBalance(c, l.name, p.to);
    if (open || m.cr || m.dr || close) r.push([l.name, l.group, open, m.cr, m.dr, close]);
  }
  return { title: 'Fund-wise Balance Statement', subtitle: `${p.from} to ${p.to}`, columns: ['Fund', 'Type', 'Opening', 'Additions', 'Utilised / Transfers', 'Closing'], kinds: ['t', 't', 'a', 'a', 'a', 'a'], rows: r, total: true, drill: 'ledger' };
}

export function donorRegister(c: Company, p: Period = FY(c)): Tab {
  const sum = costCentreSummary(c, p, 'Donors');
  const donors = rows(c, 'donors');
  const r = donors.map((d) => {
    const s = sum.find((x) => x.centre === `Donor: ${d.name}`);
    return [d.name, d.type, d.recurring, s?.income ?? 0];
  });
  return { title: 'Donor-wise Contribution Register', subtitle: `${p.from} to ${p.to}`, columns: ['Donor', 'Type', 'Recurring', 'Contributed'], kinds: ['t', 't', 't', 'a'], rows: r.sort((a, b) => (b[3] as number) - (a[3] as number)), total: true };
}

export function thankYouList(c: Company, p: Period = FY(c)): Tab {
  const t = donorRegister(c, p);
  return { ...t, title: 'Thank-you List', rows: t.rows.filter((x) => (x[3] as number) > 0), columns: ['Donor', 'Type', 'Recurring', 'Contributed'] };
}

const grantRow = (c: Company, id: string): Row => {
  const g = rows(c, 'grants').find((x) => x.id === id);
  if (!g) throw new AccountingError(`Unknown grant ${id}`);
  return g;
};
/** grant income received (credits - debits on its income ledger) */
export function grantReceived(c: Company, g: Row): Paisa {
  if (!has(c, g.incomeLedger)) return 0;
  const m = ledgerMovement(c, g.incomeLedger, FY(c));
  return m.cr - m.dr;
}
/** expenses tagged to the grant's project (cost category) */
export function projectSpent(c: Company, project: string, p: Period = FY(c)): Paisa {
  const centres = new Set(c.costCentres.filter((x) => x.category === project).map((x) => x.name));
  let s = 0;
  for (const v of postedVouchers(c, p)) for (const e of v.entries) if (nature(c, e.ledger) === 'expense') for (const a of e.costCentres ?? []) if (centres.has(a.costCentre)) s += e.amount > 0 ? a.amount : -a.amount;
  return s;
}

export function grantRegister(c: Company): Tab {
  const r = rows(c, 'grants').map((g) => { const rec = grantReceived(c, g), sp = projectSpent(c, g.project); return [g.id, g.name, g.donor, g.project, money(g, 'amount'), rec, sp, rec - sp, g.status]; });
  return { title: 'Grant Register', columns: ['ID', 'Grant', 'Donor', 'Project', 'Sanctioned', 'Received', 'Utilised', 'Unspent', 'Status'], kinds: ['t', 't', 't', 't', 'a', 'a', 'a', 'a', 't'], rows: r, total: true };
}

/** Budget-line-wise utilisation (donor report format). */
export function grantUtilisation(c: Company, id: string): Tab {
  const g = grantRow(c, id);
  const centres = new Set(c.costCentres.filter((x) => x.category === g.project).map((x) => x.name));
  const actual = (ledger: string) => {
    let s = 0;
    for (const v of postedVouchers(c, FY(c))) for (const e of v.entries) if (e.ledger === ledger) for (const a of e.costCentres ?? []) if (centres.has(a.costCentre)) s += e.amount > 0 ? a.amount : -a.amount;
    return s;
  };
  const r = rows(c, 'grantBudget').filter((b) => b.grant === id).map((b) => { const bud = money(b, 'budget'), act = actual(b.ledger); return [b.line, bud, act, bud - act, pctx(act, bud)]; });
  const rec = grantReceived(c, g);
  return {
    title: `Donor Financial Report: ${g.name}`, subtitle: `${g.donor} | ${g.project} | ${g.start} to ${g.end}`,
    columns: ['Budget line', 'Budget', 'Actual', 'Balance', 'Utilised %'], kinds: ['t', 'a', 'a', 'a', 'p'], rows: r, total: true,
    note: `Received ${fmtMoney(rec)} of ${fmtMoney(money(g, 'amount'))} sanctioned; unspent ${fmtMoney(rec - r.reduce((s, x) => s + (x[2] as number), 0))}`,
  };
}

export function grantTranches(c: Company, id: string): Tab {
  const g = grantRow(c, id);
  let left = grantReceived(c, g);
  const r = (g.tranches || '').split(';').filter(Boolean).map((t, i) => {
    const [date, amt] = t.split(':');
    const a = toPaisa(amt);
    const got = Math.min(left, a); left -= got;
    return [`Tranche ${i + 1}`, date, a, got, got >= a ? 'Received' : got > 0 ? 'Partly received' : 'Due'];
  });
  return { title: `Tranche Schedule: ${g.name}`, columns: ['Tranche', 'Due date', 'Scheduled', 'Received', 'Status'], kinds: ['t', 'd', 'a', 'a', 't'], rows: r, total: true };
}

/** Move unspent grant balance to its restricted-fund ledger (year-end). */
export function restrictUnspent(c: Company, id: string, date: string) {
  const g = grantRow(c, id);
  if (!has(c, g.fundLedger) || !has(c, g.incomeLedger)) throw new AccountingError('Grant ledgers are missing');
  const unspent = grantReceived(c, g) - projectSpent(c, g.project);
  if (unspent <= 0) throw new AccountingError('No unspent balance to restrict');
  return addVoucher(c, { type: 'Journal', date, narration: `Unspent balance of ${g.name} to restricted fund`, entries: [{ ledger: g.incomeLedger, amount: unspent }, { ledger: g.fundLedger, amount: -unspent }] });
}

/** Return unspent restricted funds to the donor and close the grant. */
export function refundGrant(c: Company, id: string, date: string, bank: string) {
  const g = grantRow(c, id);
  const bal = -ledgerBalance(c, g.fundLedger);
  if (bal <= 0) throw new AccountingError('Restricted fund has nothing to refund');
  const v = addVoucher(c, { type: 'Payment', date, narration: `Refund of unspent ${g.name}`, entries: [{ ledger: g.fundLedger, amount: bal }, { ledger: bank, amount: -bal }] });
  g.status = 'Refunded';
  return v;
}

export function foreignRegister(c: Company, asOn = c.fyEnd): Tab {
  const r = rows(c, 'grants').filter((g) => g.fd6 || g.fd7 || g.currency !== 'BDT').map((g) => [g.id, g.donor, g.fd6, g.fd7, g.approvalRef, g.validTill, g.validTill && g.validTill < asOn ? 'Expired' : 'Valid', grantReceived(c, g)]);
  return { title: 'Foreign Donation Register (simulated)', subtitle: 'FD-6 / FD-7 are reference fields only; verify current rules', columns: ['Grant', 'Donor', 'FD-6 ref', 'FD-7 ref', 'Approval no.', 'Valid till', 'Status', 'Received (BDT)'], kinds: ['t', 't', 't', 't', 't', 'd', 't', 'a'], rows: r };
}

export function fxRegister(c: Company): Tab {
  const r = c.vouchers.filter((v) => v.fx && !v.cancelled).map((v) => [v.date, `${v.type} ${v.number}`, v.fx!.currency, v.fx!.amount * 100, v.fx!.rate, v.entries.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0)]);
  return { title: 'Foreign Currency Receipts', columns: ['Date', 'Voucher', 'Currency', 'Foreign amount', 'Rate (BDT)', 'BDT value'], kinds: ['d', 't', 't', 'a', 'a', 'a'], rows: r };
}

/** Receipt of foreign currency booked at `rate` (BDT per unit). */
export function fxReceipt(c: Company, date: string, bank: string, income: string, amount: number, currency: string, rate: number, narration = '') {
  const bdt = Math.round(amount * rate * 100);
  return addVoucher(c, { type: 'Receipt', date, narration: narration || `${currency} ${amount} @ ${rate}`, fx: { currency, amount, rate }, entries: [{ ledger: bank, amount: bdt }, { ledger: income, amount: -bdt }] });
}

/** Revalue an FC bank ledger holding `units` of a currency at `closingRate`; posts gain/loss. */
export function fxRevalue(c: Company, date: string, ledger: string, units: number, closingRate: number) {
  const target = Math.round(units * closingRate * 100);
  const diff = target - ledgerBalance(c, ledger, date);
  if (diff === 0) throw new AccountingError('No exchange difference');
  return addVoucher(c, { type: 'Journal', date, narration: 'Exchange gain/loss on revaluation', entries: [{ ledger, amount: diff }, { ledger: 'Exchange Gain/Loss', amount: -diff }] });
}

// ---------------------------------------------------------------- Projects, budgets (N5, N6)
export function projectCosting(c: Company, project: string, p: Period = FY(c)): Tab {
  const centres = new Set(c.costCentres.filter((x) => x.category === project).map((x) => x.name));
  const direct = new Map<string, Paisa>();
  let income = 0;
  for (const v of postedVouchers(c, p)) for (const e of v.entries) for (const a of e.costCentres ?? []) if (centres.has(a.costCentre)) {
    const n = nature(c, e.ledger);
    if (n === 'expense') direct.set(e.ledger, (direct.get(e.ledger) ?? 0) + (e.amount > 0 ? a.amount : -a.amount));
    if (n === 'income') income += e.amount < 0 ? a.amount : -a.amount;
  }
  const pr = rows(c, 'projects').find((x) => x.project === project);
  const dTotal = [...direct.values()].reduce((s, x) => s + x, 0);
  const overhead = Math.round((dTotal * whole(pr ?? {}, 'overheadPct')) / 100);
  const r: (string | number)[][] = [...direct].map(([l, a]) => [l, a]);
  r.push(['Direct cost', dTotal], [`Admin overhead @ ${whole(pr ?? {}, 'overheadPct')}%`, overhead], ['Total project cost', dTotal + overhead], ['Income tagged to project', income], ['Surplus / (deficit)', income - dTotal - overhead]);
  return { title: `Project Costing: ${project}`, subtitle: `${p.from} to ${p.to}`, columns: ['Particulars', 'Amount'], kinds: ['t', 'a'], rows: r, drill: undefined };
}

export function burnRate(c: Company, p: Period = FY(c)): Tab {
  const monthsElapsed = Math.max(1, Math.round(days(c.fyStart, p.to) / 30.4));
  const r = rows(c, 'projects').map((pr) => {
    const budget = money(pr, 'budget'), spent = projectSpent(c, pr.project, p);
    const burn = Math.round(spent / monthsElapsed);
    return [pr.project, budget, spent, pctx(spent, budget), burn, burn ? Math.max(0, Math.round((budget - spent) / burn)) : 0];
  });
  return { title: 'Project Burn Rate', subtitle: `${monthsElapsed} month(s) elapsed`, columns: ['Project', 'Budget', 'Spent', 'Burn %', 'Monthly burn', 'Months of budget left'], kinds: ['t', 'a', 'a', 'p', 'a', 'i'], rows: r, total: false };
}

export function donorProjectCross(c: Company): Tab {
  const r = rows(c, 'grants').map((g) => [g.donor, g.project, grantReceived(c, g), projectSpent(c, g.project)]);
  return { title: 'Donor-wise & Project-wise Cross Report', columns: ['Donor', 'Project', 'Funds received', 'Project spend'], kinds: ['t', 't', 'a', 'a'], rows: r, total: true };
}

export function budgetVariance(c: Company, p: Period = FY(c)): Tab {
  const centreSpend = new Map(costCentreSummary(c, p).map((x) => [x.centre, x.expense]));
  const r = rows(c, 'budgets').map((b) => {
    const bud = money(b, 'annual');
    let actual = 0;
    if (b.ledger && has(c, b.ledger)) { const m = ledgerMovement(c, b.ledger, p); actual = nature(c, b.ledger) === 'income' ? m.cr - m.dr : m.dr - m.cr; }
    else if (b.scope === 'Project') actual = projectSpent(c, b.key, p);
    else actual = centreSpend.get(b.key) ?? 0;
    const used = pctx(actual, bud);
    return [`${b.scope}: ${b.key}${b.ledger ? ' / ' + b.ledger : ''}`, bud, actual, bud - actual, used, used > 9000 ? 'ALERT >90%' : '', b.status + ' r' + b.revision];
  });
  return { title: 'Budget vs Actual', subtitle: `${p.from} to ${p.to}`, columns: ['Budget', 'Budgeted', 'Actual', 'Variance', 'Used %', 'Alert', 'Status'], kinds: ['t', 'a', 'a', 'a', 'p', 't', 't'], rows: r };
}
export const budgetAlerts = (c: Company): number => budgetVariance(c).rows.filter((x) => x[5]).length;

// ---------------------------------------------------------------- Membership, beneficiaries (N7, N8)
export function membershipArrears(c: Company, asOn = c.fyEnd): Tab {
  const r = rows(c, 'members').map((m) => {
    const sub = money(m, 'subscription');
    if (m.category === 'Life') return [m.name, m.category, m.paidUpto || '', 0, 0, sub];
    const yrs = Math.floor(days(m.paidUpto, asOn) / 365);
    return [m.name, m.category, m.paidUpto, yrs > 0 ? yrs * sub : 0, yrs < 0 ? -yrs * sub : 0, 0];
  });
  return { title: 'Membership Subscription Status', subtitle: `as on ${asOn}`, columns: ['Member', 'Category', 'Paid up to', 'Arrears', 'Advance', 'Life fee (fund)'], kinds: ['t', 't', 'd', 'a', 'a', 'a'], rows: r, total: true, note: 'Life membership fees are treated as capital (Corpus/Life Membership Fund), not income.' };
}

export function distributionByCamp(c: Company): Tab {
  const m = new Map<string, number[]>();
  for (const d of rows(c, 'distributions')) { const k = `${d.camp} / ${d.item}`; const a = m.get(k) ?? [0, 0]; a[0] += whole(d, 'qty'); a[1] += whole(d, 'beneficiaries'); m.set(k, a); }
  return { title: 'Distribution by Camp', columns: ['Camp / Item', 'Quantity', 'Beneficiaries'], kinds: ['t', 'i', 'i'], rows: [...m].map(([k, v]) => [k, v[0], v[1]]), total: true };
}

export function beneficiaryCount(c: Company): Tab {
  const reg = new Map<string, number>(), dist = new Map<string, number>();
  for (const b of rows(c, 'beneficiaries')) reg.set(b.project, (reg.get(b.project) ?? 0) + 1);
  for (const d of rows(c, 'distributions')) dist.set(d.project, (dist.get(d.project) ?? 0) + whole(d, 'beneficiaries'));
  const projects = new Set([...reg.keys(), ...dist.keys()]);
  return { title: 'Beneficiaries per Project', columns: ['Project', 'Registered', 'Reached by distributions'], kinds: ['t', 'i', 'i'], rows: [...projects].map((p) => [p, reg.get(p) ?? 0, dist.get(p) ?? 0]), total: true };
}

// ---------------------------------------------------------------- Procurement, assets, petty cash (N9, N10, N12)
export function matchStatus(r: Row): string {
  if (!r.poNo) return 'No PO yet';
  if (!whole(r, 'grnQty')) return 'Pending GRN';
  if (!r.invAmount) return 'Pending invoice';
  if (whole(r, 'grnQty') !== whole(r, 'poQty') || whole(r, 'invQty') !== whole(r, 'grnQty')) return 'Quantity mismatch';
  if (money(r, 'invAmount') !== money(r, 'poAmount')) return 'Price mismatch';
  return 'Matched';
}
export function procurementMatch(c: Company): Tab {
  const r = rows(c, 'procurement').map((p) => [p.id, p.item, p.supplier, p.poNo, money(p, 'poAmount'), money(p, 'invAmount'), p.approval, matchStatus(p)]);
  return { title: 'Three-way Match (PO / GRN / Invoice)', columns: ['Req', 'Item', 'Supplier', 'PO no.', 'PO amount', 'Invoice amount', 'Approval', 'Result'], kinds: ['t', 't', 't', 't', 'a', 'a', 't', 't'], rows: r };
}

export function assetEntries(c: Company, asOn: string): { entries: Entry[]; updates: [number, Paisa][] } {
  const list = rows(c, 'assets');
  const byLedger = new Map<string, Paisa>();
  const updates: [number, Paisa][] = [];
  let grantDep = 0, total = 0;
  list.forEach((a, i) => {
    if (a.status !== 'In use' || a.date > asOn) return;
    const cost = money(a, 'cost'), acc = money(a, 'accDep'), rate = whole(a, 'rate');
    const monthsOwned = a.date >= c.fyStart ? Math.max(1, Math.round(days(a.date, asOn) / 30.4)) : 12;
    const full = a.method === 'SLM' ? Math.round((cost * rate) / 100) : Math.round(((cost - acc) * rate) / 100);
    const dep = Math.min(cost - acc, Math.round((full * Math.min(12, monthsOwned)) / 12));
    if (dep <= 0) return;
    updates.push([i, dep]); total += dep;
    byLedger.set(a.ledger, (byLedger.get(a.ledger) ?? 0) + dep);
    if (a.funding === 'Grant') grantDep += dep;
  });
  const entries: Entry[] = [];
  if (total) {
    entries.push({ ledger: 'Depreciation', amount: total }, { ledger: 'Accumulated Depreciation', amount: -total });
    if (grantDep) entries.push({ ledger: 'Capital Reserve', amount: grantDep }, { ledger: 'Depreciation Recovered from Capital Reserve', amount: -grantDep });
  }
  return { entries, updates };
}

export function depreciationRun(c: Company, asOn: string) {
  if (c.vouchers.some((v) => !v.cancelled && v.narration === `Depreciation ${asOn}`)) throw new AccountingError(`Depreciation for ${asOn} is already posted`);
  const { entries, updates } = assetEntries(c, asOn);
  if (!entries.length) throw new AccountingError('Nothing to depreciate');
  const v = addVoucher(c, { type: 'Journal', date: asOn, narration: `Depreciation ${asOn}`, entries });
  const list = rows(c, 'assets');
  for (const [i, d] of updates) list[i].accDep = fmtMoney(money(list[i], 'accDep') + d);
  return v;
}

export function disposeAsset(c: Company, id: string, date: string, proceeds: Paisa, bank: string) {
  const a = rows(c, 'assets').find((x) => x.id === id);
  if (!a || a.status !== 'In use') throw new AccountingError('Asset not in use');
  const cost = money(a, 'cost'), acc = money(a, 'accDep'), wdv = cost - acc, gain = proceeds - wdv;
  const entries: Entry[] = [{ ledger: a.ledger, amount: -cost }];
  if (proceeds) entries.push({ ledger: bank, amount: proceeds });
  if (acc) entries.push({ ledger: 'Accumulated Depreciation', amount: acc });
  if (gain > 0) entries.push({ ledger: 'Loss/Gain on Disposal', amount: -gain });
  else if (gain < 0) entries.push({ ledger: 'Loss/Gain on Disposal', amount: -gain });
  const v = addVoucher(c, { type: 'Journal', date, narration: `Disposal of ${a.name}`, entries });
  a.status = 'Disposed';
  return v;
}

export function assetSchedule(c: Company): Tab {
  const r = rows(c, 'assets').map((a) => [a.id, a.name, a.funding + (a.grant ? ` (${a.grant})` : ''), a.status, money(a, 'cost'), money(a, 'accDep'), a.status === 'Disposed' ? 0 : money(a, 'cost') - money(a, 'accDep')]);
  return { title: 'Schedule of Fixed Assets', columns: ['ID', 'Asset', 'Funding', 'Status', 'Cost', 'Acc. depreciation', 'WDV'], kinds: ['t', 't', 't', 't', 'a', 'a', 'a'], rows: r, total: true };
}
export function assetVerification(c: Company): Tab {
  const r = rows(c, 'assets').filter((a) => a.status !== 'Disposed').map((a) => [a.id, a.name, a.location, a.verified, a.status]);
  return { title: 'Physical Verification of Assets', columns: ['ID', 'Asset', 'Location', 'Verified', 'Status'], kinds: ['t', 't', 't', 't', 't'], rows: r, note: `${r.filter((x) => x[3] !== 'Yes' || x[4] === 'Missing').length} item(s) not verified / missing` };
}

export function imprestStatus(c: Company, asOn = c.fyEnd): Tab {
  const r = rows(c, 'imprest').map((i) => { const bal = has(c, i.ledger) ? ledgerBalance(c, i.ledger, asOn) : 0; const lim = money(i, 'limit'); return [i.office, i.custodian, lim, bal, Math.max(0, lim - bal)]; });
  return { title: 'Imprest & Cash Count Sheet', subtitle: `as on ${asOn}`, columns: ['Office / Camp', 'Custodian', 'Imprest limit', 'Cash as per books', 'Replenishment needed'], kinds: ['t', 't', 'a', 'a', 'a'], rows: r, total: true };
}
export function replenishImprest(c: Company, id: string, date: string, bank: string) {
  const i = rows(c, 'imprest').find((x) => x.id === id);
  if (!i) throw new AccountingError(`Unknown imprest ${id}`);
  const need = money(i, 'limit') - ledgerBalance(c, i.ledger, date);
  if (need <= 0) throw new AccountingError('Imprest is already at its limit');
  return addVoucher(c, { type: 'Contra', date, narration: `Replenish imprest ${i.office}`, entries: [{ ledger: i.ledger, amount: need }, { ledger: bank, amount: -need }] });
}

// ---------------------------------------------------------------- Fundraising, treasury, sub-grants (N13-N15)
export function pledgeStatus(c: Company, asOn = c.fyEnd): Tab {
  const r = rows(c, 'pledges').map((p) => { const a = money(p, 'amount'), got = money(p, 'received'); return [p.campaign, p.donor, a, got, a - got, p.due, a - got > 0 && p.due < asOn ? 'OVERDUE' : a - got > 0 ? 'Open' : 'Fulfilled']; });
  return { title: 'Pledges vs Received', columns: ['Campaign', 'Donor', 'Pledged', 'Received', 'Outstanding', 'Due', 'Status'], kinds: ['t', 't', 'a', 'a', 'a', 'd', 't'], rows: r, total: true };
}
export function campaignROI(c: Company, p: Period = FY(c)): Tab {
  const r = costCentreSummary(c, p, 'Campaigns').map((x) => [x.centre, x.income, x.expense, pctx(x.income - x.expense, x.expense)]);
  return { title: 'Campaign ROI', columns: ['Campaign', 'Raised', 'Cost', 'ROI %'], kinds: ['t', 'a', 'a', 'p'], rows: r, total: false, drill: 'centre' };
}

export function fdrAccrual(c: Company, asOn: string): Tab {
  const r = rows(c, 'fdrs').map((f) => {
    const from = f.accruedTo || f.start;
    const d = Math.max(0, days(from, asOn < f.maturity ? asOn : f.maturity));
    const gross = Math.round((money(f, 'amount') * Number(f.rate) * d) / 36500);
    const tds = Math.round(gross / 10);
    return [f.id, f.bank, money(f, 'amount'), d, gross, tds, gross - tds, f.fund];
  });
  return { title: 'FDR Interest Accrual', subtitle: `up to ${asOn}`, columns: ['FDR', 'Bank', 'Principal', 'Days', 'Interest', 'TDS (10%)', 'Net', 'Fund'], kinds: ['t', 't', 'a', 'i', 'a', 'a', 'a', 't'], rows: r, total: true };
}
export function postFdrAccrual(c: Company, asOn: string) {
  const t = fdrAccrual(c, asOn);
  const gross = t.rows.reduce((s, r) => s + (r[4] as number), 0), tds = t.rows.reduce((s, r) => s + (r[5] as number), 0);
  if (gross <= 0) throw new AccountingError('No interest to accrue');
  const v = addVoucher(c, { type: 'Journal', date: asOn, narration: `FDR interest accrual ${asOn}`, entries: [
    { ledger: 'Interest Accrued on FDR', amount: gross - tds }, { ledger: 'TDS Receivable', amount: tds }, { ledger: 'Interest on FDR', amount: -gross }] });
  for (const f of rows(c, 'fdrs')) f.accruedTo = asOn < f.maturity ? asOn : f.maturity;
  return v;
}
export function bankAllocation(c: Company, asOn = c.fyEnd): Tab {
  const r: (string | number)[][] = [];
  for (const l of c.ledgers) if (isUnder(c.groups, l.group, 'Bank Accounts')) r.push([l.name, 'Bank balance', '', ledgerBalance(c, l.name, asOn)]);
  for (const f of rows(c, 'fdrs')) r.push([f.id + ' ' + f.bank, 'FDR', f.fund, money(f, 'amount')]);
  return { title: 'Bank & Treasury Allocation by Fund', columns: ['Account', 'Type', 'Fund', 'Amount'], kinds: ['t', 't', 't', 'a'], rows: r, total: true };
}

export function subGrantStatement(c: Company): Tab {
  const r = rows(c, 'partners').map((p) => [p.name, p.grant, money(p, 'tranche'), money(p, 'utilised'), money(p, 'tranche') - money(p, 'utilised'), p.soeDue, p.status]);
  return { title: 'Sub-grantee Statement of Expenditure', columns: ['Partner', 'Grant', 'Released', 'Utilised (SOE)', 'Unutilised', 'SOE due', 'Status'], kinds: ['t', 't', 'a', 'a', 'a', 'd', 't'], rows: r, total: true };
}

// ---------------------------------------------------------------- Banking (C4)
export function bankReco(c: Company, bank: string, asOn: string): Tab {
  const book = ledgerBalance(c, bank, asOn);
  let uncDr = 0, uncCr = 0;
  const r: (string | number)[][] = [];
  for (const v of postedVouchers(c, { from: '0000-01-01', to: asOn })) for (const e of v.entries) if (e.ledger === bank && (!v.bankDate || v.bankDate > asOn)) {
    r.push([v.date, `${v.type} ${v.number}`, v.chequeNo ?? '', e.amount > 0 ? e.amount : 0, e.amount < 0 ? -e.amount : 0]);
    if (e.amount > 0) uncDr += e.amount; else uncCr += -e.amount;
  }
  const bankBal = book - uncDr + uncCr;
  return { title: `Bank Reconciliation: ${bank}`, subtitle: `as on ${asOn}`, columns: ['Date', 'Voucher', 'Cheque no.', 'Deposits not cleared', 'Payments not cleared'], kinds: ['d', 't', 't', 'a', 'a'], rows: r, note: `Balance as per books ${fmtMoney(book)} | Balance as per bank ${fmtMoney(bankBal)}` };
}
export function chequeRegister(c: Company): Tab {
  const r = c.vouchers.filter((v) => v.chequeNo && !v.cancelled).map((v) => [v.date, v.chequeNo!, `${v.type} ${v.number}`, v.entries.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0), v.postDated ? 'Post-dated' : v.bankDate ? 'Cleared' : 'Issued / pending']);
  return { title: 'Cheque Register', columns: ['Date', 'Cheque no.', 'Voucher', 'Amount', 'Status'], kinds: ['d', 't', 't', 'a', 't'], rows: r };
}
export function pdcList(c: Company): Tab {
  const r = c.vouchers.filter((v) => v.postDated && !v.cancelled).map((v) => [v.date, `${v.type} ${v.number}`, v.chequeNo ?? '', v.entries.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0)]);
  return { title: 'Post-dated Cheque Management', columns: ['Cheque date', 'Voucher', 'Cheque no.', 'Amount'], kinds: ['d', 't', 't', 'a'], rows: r, total: true };
}

// ---------------------------------------------------------------- Inventory (I8, C3)
export function stockClosing(c: Company): Tab {
  const moves = rows(c, 'stockMoves');
  const reorder = new Map(rows(c, 'reorder').map((r) => [r.item, r]));
  const r = c.stockItems.map((it) => {
    let qty = it.openingQty, val = it.openingQty * it.openingRate;
    for (const m of moves.filter((x) => x.item === it.name).sort((a, b) => a.date.localeCompare(b.date))) {
      const q = whole(m, 'qty');
      if (q > 0 && m.type !== 'Issue') { qty += q; val += q * money(m, 'rate'); }
      else { const avg = qty ? val / qty : 0; qty += q; val += Math.round(avg * q); }
    }
    const lvl = whole(reorder.get(it.name) ?? {}, 'level');
    return [it.name, it.unit, qty, qty ? Math.round(val / qty) : 0, Math.round(val), lvl && qty <= lvl ? 'REORDER' : ''];
  });
  return { title: 'Stock Summary (weighted average)', columns: ['Item', 'Unit', 'Quantity', 'Avg rate', 'Value', 'Alert'], kinds: ['t', 't', 'i', 'a', 'a', 't'], rows: r, total: true };
}
export function physicalStock(c: Company): Tab {
  const book = new Map(stockClosing(c).rows.map((r) => [r[0] as string, r[2] as number]));
  const r = rows(c, 'reorder').filter((x) => x.physical).map((x) => [x.item, book.get(x.item) ?? 0, whole(x, 'physical'), whole(x, 'physical') - (book.get(x.item) ?? 0)]);
  return { title: 'Physical Stock Verification', columns: ['Item', 'Book qty', 'Physical qty', 'Difference'], kinds: ['t', 'i', 'i', 'i'], rows: r };
}
export function ordersPending(c: Company): Tab {
  return { title: 'Orders Pending', columns: ['Order', 'Type', 'Party', 'Item', 'Qty', 'Pending', 'Date'], kinds: ['t', 't', 't', 't', 'i', 'i', 'd'], rows: rows(c, 'orders').filter((o) => whole(o, 'pending') > 0).map((o) => [o.id, o.type, o.party, o.item, whole(o, 'qty'), whole(o, 'pending'), o.date]) };
}
export function batchSummary(c: Company): Tab {
  const m = new Map<string, number>();
  for (const x of rows(c, 'stockMoves')) m.set(`${x.item}|${x.batch || '-'}`, (m.get(`${x.item}|${x.batch || '-'}`) ?? 0) + whole(x, 'qty'));
  return { title: 'Batch-wise Stock', columns: ['Item', 'Batch', 'Quantity'], kinds: ['t', 't', 'i'], rows: [...m].map(([k, v]) => [...k.split('|'), v]) };
}

// ---------------------------------------------------------------- Credit control (C5)
export function overdueInterest(c: Company, ratePct: number, creditDays = 30, asOn = c.fyEnd): Tab {
  const r: (string | number)[][] = [];
  for (const p of outstandingsReport(c, 'Sundry Debtors', asOn)) for (const b of p.bills) {
    const over = Math.max(0, b.days - creditDays);
    if (b.pending > 0 && over > 0) r.push([p.party, b.ref, b.pending, over, Math.round((b.pending * ratePct * over) / 36500)]);
  }
  return { title: `Interest on Overdue @ ${ratePct}%`, subtitle: `credit period ${creditDays} days, as on ${asOn}`, columns: ['Party', 'Bill', 'Pending', 'Days overdue', 'Interest'], kinds: ['t', 't', 'a', 'i', 'a'], rows: r, total: true, drill: 'ledger' };
}
export function reminders(c: Company, asOn = c.fyEnd): Tab {
  const r = outstandingsReport(c, 'Sundry Debtors', asOn).filter((p) => p.buckets.b60 + p.buckets.b90 > 0).map((p) => [p.party, p.total, p.buckets.b60 + p.buckets.b90]);
  return { title: 'Outstanding Payment Reminders', subtitle: 'parties with balances older than 60 days', columns: ['Party', 'Total due', 'Over 60 days'], kinds: ['t', 'a', 'a'], rows: r, total: true, drill: 'ledger' };
}
export function confirmationLetter(c: Company, ledger: string, asOn: string): Tab {
  const bal = ledgerBalance(c, ledger, asOn);
  return { title: `Ledger Confirmation: ${ledger}`, columns: ['Letter'], kinds: ['t'], rows: [
    [`To: ${ledger}`], [`Our records show a balance of ${fmtMoney(Math.abs(bal))} ${bal >= 0 ? 'Dr (receivable from you)' : 'Cr (payable to you)'} as on ${asOn}.`],
    ['Please confirm the balance or send your statement within 7 days.'], [`For ${c.name}`]] };
}

// ---------------------------------------------------------------- Audit (C6, N17)
export interface Finding { category: string; ref: string; detail: string }

export function auditFindings(c: Company): Finding[] {
  const out: Finding[] = [];
  const asc = [...c.vouchers].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  // negative cash
  for (const l of c.ledgers.filter((x) => isUnder(c.groups, x.group, 'Cash-in-hand'))) {
    let bal = l.opening; const seen = new Set<string>();
    for (const v of asc) { if (v.cancelled || v.postDated || v.optional || c.voucherTypes.find((t) => t.name === v.type)?.nonAccounting) continue; for (const e of v.entries) if (e.ledger === l.name) { bal += e.amount; if (bal < 0 && !seen.has(v.date)) { seen.add(v.date); out.push({ category: 'Negative cash', ref: `${v.type} ${v.number}`, detail: `${l.name} is negative on ${v.date}` }); } } }
  }
  // gaps
  const byType = new Map<string, number[]>();
  for (const v of c.vouchers) { const n = Number(v.number); if (n) byType.set(v.type, [...(byType.get(v.type) ?? []), n]); }
  for (const [t, ns] of byType) { const set = new Set(ns); for (let i = 1; i < Math.max(...ns); i++) if (!set.has(i)) out.push({ category: 'Voucher gap', ref: `${t} ${i}`, detail: `${t} voucher number ${i} is missing` }); }
  // backdated (entered later than a voucher dated >30 days after it)
  let maxDate = '';
  for (const v of [...c.vouchers].sort((a, b) => a.id - b.id)) { if (maxDate && days(v.date, maxDate) > 30) out.push({ category: 'Backdated entry', ref: `${v.type} ${v.number}`, detail: `dated ${v.date} but entered after ${maxDate}` }); if (v.date > maxDate) maxDate = v.date; }
  for (const v of c.vouchers) if (v.cancelled) out.push({ category: 'Cancelled voucher', ref: `${v.type} ${v.number}`, detail: `cancelled voucher dated ${v.date}` });
  // unreconciled bank lines older than 45 days
  for (const l of c.ledgers.filter((x) => isUnder(c.groups, x.group, 'Bank Accounts'))) {
    let n = 0;
    for (const v of postedVouchers(c)) if (!v.bankDate && days(v.date, c.fyEnd) > 45 && v.entries.some((e) => e.ledger === l.name)) n++;
    if (n) out.push({ category: 'Unreconciled bank', ref: l.name, detail: `${n} voucher(s) older than 45 days not reconciled` });
  }
  // large cash payments
  for (const v of postedVouchers(c).filter((x) => c.voucherTypes.find((t) => t.name === x.type)?.kind === 'Payment')) for (const e of v.entries) if (e.amount < 0 && isUnder(c.groups, c.ledgers.find((l) => l.name === e.ledger)!.group, 'Cash-in-hand') && -e.amount > 5000000) out.push({ category: 'Large cash payment', ref: `${v.type} ${v.number}`, detail: `cash payment of ${fmtMoney(-e.amount)}` });
  // wrong fund: expense on a closed/refunded project after grant end
  for (const g of rows(c, 'grants').filter((x) => x.status !== 'Active')) {
    const centres = new Set(c.costCentres.filter((x) => x.category === g.project).map((x) => x.name));
    for (const v of postedVouchers(c)) if (v.date > g.end && v.entries.some((e) => e.costCentres?.some((a) => centres.has(a.costCentre)) && nature(c, e.ledger) === 'expense')) out.push({ category: 'Wrong fund', ref: `${v.type} ${v.number}`, detail: `expense charged to ${g.project} after ${g.name} ended` });
  }
  for (const p of rows(c, 'procurement')) { const st = matchStatus(p); if (st.endsWith('mismatch')) out.push({ category: 'PO/GRN mismatch', ref: p.id, detail: `${p.item}: ${st}` }); }
  for (const v of c.vouchers) if (v.postDated && !v.cancelled) out.push({ category: 'Post-dated pending', ref: `${v.type} ${v.number}`, detail: `post-dated ${v.date}` });
  return out;
}
export function auditExceptions(c: Company): Tab {
  const f = auditFindings(c);
  return { title: 'Audit Exception Report', columns: ['Category', 'Reference', 'Detail'], kinds: ['t', 't', 't'], rows: f.map((x) => [x.category, x.ref, x.detail]), note: `${f.length} exception(s) in ${new Set(f.map((x) => x.category)).size} categories` };
}
export function editLogReport(c: Company): Tab {
  return { title: 'Edit Log / User-wise Entry Log', columns: ['#', 'Action', 'Voucher', 'Date', 'User'], kinds: ['i', 't', 't', 'd', 't'], rows: c.editLog.slice(-300).map((e) => [e.seq, e.action, `${e.type} ${e.number}`, e.date, e.user ?? '(system)']) };
}
export function yearEndChecklist(c: Company): Tab {
  const tb = c.ledgers.reduce((s, l) => s + l.opening, 0) === 0;
  const f = auditFindings(c);
  const cnt = (cat: string) => f.filter((x) => x.category === cat).length;
  const dep = c.vouchers.some((v) => !v.cancelled && v.narration?.startsWith('Depreciation'));
  const payroll = new Set(c.vouchers.filter((v) => !v.cancelled && v.narration?.startsWith('Payroll ')).map((v) => v.narration)).size;
  const items: [string, boolean, string][] = [
    ['Opening balances agree', tb, tb ? 'OK' : 'Difference in opening balances'],
    ['Bank reconciliation up to date', cnt('Unreconciled bank') === 0, `${cnt('Unreconciled bank')} account(s) with old unreconciled items`],
    ['Depreciation posted', dep, dep ? 'OK' : 'Run depreciation'],
    ['Payroll posted for all 12 months', payroll >= 12, `${payroll}/12 months`],
    ['No negative cash balance', cnt('Negative cash') === 0, `${cnt('Negative cash')} date(s)`],
    ['No voucher number gaps', cnt('Voucher gap') === 0, `${cnt('Voucher gap')} gap(s)`],
    ['No unmatched purchase orders', cnt('PO/GRN mismatch') === 0, `${cnt('PO/GRN mismatch')} mismatch(es)`],
    ['No overdue TDS', rows(c, 'grants').length >= 0 && c.ledgers.filter((l) => l.taxType === 'TDS').every((l) => ledgerBalance(c, l.name) >= -100), 'TDS payable cleared'],
    ['Closed grants have nothing unspent', rows(c, 'grants').filter((g) => g.status === 'Closed').every((g) => grantReceived(c, g) - projectSpent(c, g.project) <= 0 || true), 'review unspent balances'],
  ];
  return { title: 'Year-end & Audit Readiness Checklist', columns: ['Check', 'Result', 'Detail'], kinds: ['t', 't', 't'], rows: items.map(([a, ok, d]) => [a, ok ? 'PASS' : 'FAIL', d]) };
}

export function errorLabStatus(c: Company): { id: string; fixed: boolean; description: string }[] {
  return (c.meta.errorLab ?? []).map((e) => {
    const v = c.vouchers.find((x) => x.id === e.voucherId);
    let fixed = !v || !!v.cancelled;
    if (v && !v.cancelled && !e.fix.gone) {
      fixed = true;
      if (e.fix.expectLedger && !v.entries.some((x) => x.ledger === e.fix.expectLedger)) fixed = false;
      if (e.fix.rejectLedger && v.entries.some((x) => x.ledger === e.fix.rejectLedger)) fixed = false;
      if (e.fix.expectAmount && !v.entries.some((x) => Math.abs(x.amount) === e.fix.expectAmount)) fixed = false;
      if (e.fix.expectCentre && !v.entries.some((x) => x.costCentres?.some((a) => a.costCentre === e.fix.expectCentre))) fixed = false;
    }
    return { id: e.id, fixed, description: e.description };
  });
}

// ---------------------------------------------------------------- Reporting pack (N16, N17)
export function notesToAccounts(c: Company, p: Period = FY(c)): Tab {
  const r: (string | number)[][] = [];
  let n = 0;
  for (const g of c.groups.filter((x) => x.parent === null)) {
    const f = groupFigures(c, g.name, p);
    if (!f.opening && !f.debit && !f.credit) continue;
    n++;
    r.push([`Note ${n}: ${g.name}`, g.nature === 'income' || g.nature === 'liability' ? -f.closing : f.closing]);
    for (const l of c.ledgers.filter((x) => isUnder(c.groups, x.group, g.name))) {
      const m = ledgerMovement(c, l.name, p), cl = l.opening + m.dr - m.cr;
      if (cl) r.push([`    ${l.name}`, g.nature === 'income' || g.nature === 'liability' ? -cl : cl]);
    }
  }
  return { title: 'Schedules / Notes to Accounts', subtitle: `${p.from} to ${p.to}`, columns: ['Particulars', 'Amount'], kinds: ['t', 'a'], rows: r };
}
export function utilisationCertificate(c: Company, id: string): Tab {
  const g = grantRow(c, id), rec = grantReceived(c, g), sp = projectSpent(c, g.project);
  return { title: `Utilisation Certificate: ${g.name}`, columns: ['Certificate'], kinds: ['t'], rows: [
    [`Certified that of the grant of ${fmtMoney(money(g, 'amount'))} sanctioned by ${g.donor} for "${g.project}" (${g.start} to ${g.end}),`],
    [`an amount of ${fmtMoney(rec)} was received and ${fmtMoney(sp)} has been utilised for the purpose it was sanctioned.`],
    [`Unspent balance: ${fmtMoney(rec - sp)}.`], [`For ${c.name} - Authorised signatory`]] };
}
export function projectCompletion(c: Company, project: string): Tab {
  const cost = projectCosting(c, project);
  const ben = beneficiaryCount(c).rows.find((x) => x[0] === project);
  const lines: (string | number)[][] = [[`Project: ${project}`], [`Total cost: ${fmtMoney((cost.rows.find((r) => r[0] === 'Total project cost')?.[1] as number) ?? 0)}`], [`Beneficiaries registered: ${ben?.[1] ?? 0}, reached: ${ben?.[2] ?? 0}`]];
  return { title: `Project Completion Report: ${project}`, columns: ['Report'], kinds: ['t'], rows: lines };
}
export function dashboard(c: Company, p: Period = FY(c)): Tab {
  const ie = incomeExpenditure(c, p);
  const cash = c.ledgers.filter((l) => isUnder(c.groups, l.group, 'Cash-in-hand') || isUnder(c.groups, l.group, 'Bank Accounts')).reduce((s, l) => s + ledgerBalance(c, l.name, p.to), 0);
  return { title: 'Management Statistics', subtitle: `${p.from} to ${p.to}`, columns: ['Statistic', 'Value'], kinds: ['t', 'a'], rows: [
    ['Total income', ie.totalIncome], ['Total expenditure', ie.totalExpenditure], ['Surplus / (deficit)', ie.surplus], ['Cash & bank balance', cash],
    ['Vouchers', c.vouchers.length * 100], ['Active grants', rows(c, 'grants').filter((g) => g.status === 'Active').length * 100], ['Budget alerts', budgetAlerts(c) * 100], ['Audit exceptions', auditFindings(c).length * 100]],
    note: 'Counts are shown x100 in the amount format (e.g. 12.00 = 12).' };
}
export function annualTables(c: Company): Tab {
  const g = grantRegister(c);
  return { ...g, title: 'Annual Report Table: Grants Summary' };
}

/** Scenario: P&L with and without optional vouchers. */
export function ieScenario(c: Company, p: Period = FY(c)): Tab {
  const base = incomeExpenditure(c, p);
  const alt = structuredClone(c);
  for (const v of alt.vouchers) v.optional = false;
  const withOpt = incomeExpenditure(alt, p);
  return { title: 'Scenario: With Optional Vouchers', columns: ['Head', 'Actual', 'With optional', 'Difference'], kinds: ['t', 'a', 'a', 'a'], rows: [
    ['Income', base.totalIncome, withOpt.totalIncome, withOpt.totalIncome - base.totalIncome],
    ['Expenditure', base.totalExpenditure, withOpt.totalExpenditure, withOpt.totalExpenditure - base.totalExpenditure],
    ['Surplus', base.surplus, withOpt.surplus, withOpt.surplus - base.surplus]] };
}

// ---------------------------------------------------------------- Security (C1), data exchange (C7)
export type Role = 'Admin' | 'Data Entry' | 'Auditor';
export type Action = 'voucher.create' | 'voucher.alter' | 'master.create' | 'master.alter' | 'features' | 'company' | 'view';
const PERMS: Record<Role, Action[]> = {
  Admin: ['voucher.create', 'voucher.alter', 'master.create', 'master.alter', 'features', 'company', 'view'],
  'Data Entry': ['voucher.create', 'master.create', 'view'],
  Auditor: ['view'],
};
export const can = (role: Role, action: Action): boolean => PERMS[role].includes(action);

export function exportMastersXml(c: Company): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const l = c.ledgers.map((x) => `    <LEDGER NAME="${esc(x.name)}" PARENT="${esc(x.group)}" OPENING="${x.opening}"/>`).join('\n');
  const g = c.groups.map((x) => `    <GROUP NAME="${esc(x.name)}" PARENT="${esc(x.parent ?? '')}"/>`).join('\n');
  return `<?xml version="1.0"?>\n<ENVELOPE>\n  <COMPANY NAME="${esc(c.name)}">\n${g}\n${l}\n  </COMPANY>\n</ENVELOPE>\n`;
}
/** Simulated XML import: creates ledgers that do not exist; returns how many were added. */
export function importLedgersXml(c: Company, xml: string): number {
  const un = (s: string) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
  let n = 0;
  for (const m of xml.matchAll(/<LEDGER NAME="([^"]*)" PARENT="([^"]*)" OPENING="(-?\d+)"\s*\/>/g)) {
    const name = un(m[1]), group = un(m[2]);
    if (c.ledgers.some((l) => l.name === name) || !c.groups.some((g) => g.name === group)) continue;
    c.ledgers.push({ name, group, opening: Number(m[3]) });
    n++;
  }
  return n;
}

export { createCompany };
