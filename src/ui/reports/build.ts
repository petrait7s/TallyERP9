import {
  balanceSheetGroups, costCentreStatement, costCentreSummary, dayBefore, dayBook, formatAmount, formatDrCr, fundStatement,
  groupChildren, groupSummary, ieGroups, isUnder, ledgerAccount, ledgerBalance, outstandingsReport, ratios, receiptsPayments,
  regDef, rows, stockSummary, tdsPayable, toPaisa, vatSummary, type Company, type GLine, type Paisa, type Period, type SummaryRow,
} from '../../engine';
import { formatDate } from '../dates';
import { buildModule } from './modules';
import type { BuildOpts, ReportModel, ReportParams, Row } from './types';

const amt = (p: Paisa) => (p === 0 ? '' : formatAmount(p));
const bal = (p: Paisa) => (p === 0 ? '' : formatDrCr(p));
const range = (p: Period) => `${formatDate(p.from)} to ${formatDate(p.to)}`;

function pad(left: Row[], right: Row[], cols: number): [Row[], Row[]] {
  const l = left.filter((r) => !r.total);
  const r = right.filter((x) => !x.total);
  const lt = left.filter((x) => x.total);
  const rt = right.filter((x) => x.total);
  const blank = (): Row => ({ cells: Array(cols).fill('') });
  while (l.length < r.length) l.push(blank());
  while (r.length < l.length) r.push(blank());
  return [[...l, ...lt], [...r, ...rt]];
}

/** children of a group, recursively, as indented rows. `value` picks the amount from a summary row. */
function expand(c: Company, group: string, p: Period, value: (r: SummaryRow) => Paisa, depth = 1): Row[] {
  const rows: Row[] = [];
  for (const r of groupSummary(c, group, p)) {
    const v = value(r);
    if (r.kind === 'group') {
      rows.push({ cells: [r.name, amt(v)], indent: depth, drill: { id: 'group', group: r.name } });
      rows.push(...expand(c, r.name, p, value, depth + 1));
    } else {
      rows.push({ cells: [r.name, amt(v)], indent: depth, drill: { id: 'ledger', ledger: r.name } });
    }
  }
  return rows;
}

function sideRows(c: Company, lines: GLine[], p: Period, detailed: boolean, value: (r: SummaryRow) => Paisa): Row[] {
  const rows: Row[] = [];
  for (const l of lines) {
    if (l.kind === 'diff') { rows.push({ cells: [l.name, amt(l.amount)], bold: true }); continue; }
    if (l.kind === 'result') { rows.push({ cells: [l.name, amt(l.amount)], bold: true, drill: { id: 'ie' } }); continue; }
    rows.push({ cells: [l.name, amt(l.amount)], bold: detailed, drill: { id: 'group', group: l.name } });
    if (detailed) rows.push(...expand(c, l.name, p, value));
  }
  return rows;
}

function twoSided(title: string, subtitle: string, lt: string, rt: string, left: Row[], right: Row[], tl: Paisa, tr: Paisa, opts: BuildOpts, extra: Partial<ReportModel> = {}): ReportModel {
  const totL: Row = { cells: ['Total', amt(tl)], total: true, bold: true };
  const totR: Row = { cells: ['Total', amt(tr)], total: true, bold: true };
  if (opts.vertical) {
    return {
      title, subtitle, layout: 'single', columns: ['Particulars', 'Amount'], numericFrom: 1, canDetail: true, canVertical: true,
      rows: [{ cells: [lt, ''], heading: true }, ...left, totL, { cells: [rt, ''], heading: true }, ...right, totR], ...extra,
    };
  }
  const [l, r] = pad([...left, totL], [...right, totR], 2);
  return { title, subtitle, layout: 'double', columns: ['Particulars', 'Amount'], numericFrom: 1, rows: l, right: r, leftTitle: lt, rightTitle: rt, canDetail: true, canVertical: true, ...extra };
}

function summaryRows(c: Company, group: string | null, p: Period, detailed: boolean, depth = 0): Row[] {
  const out: Row[] = [];
  for (const r of groupSummary(c, group, p)) {
    out.push({
      cells: [r.name, bal(r.opening), amt(r.debit), amt(r.credit), bal(r.closing)],
      indent: depth, bold: r.kind === 'group' && depth === 0,
      drill: r.kind === 'group' ? { id: 'group', group: r.name } : { id: 'ledger', ledger: r.name },
    });
    if (detailed && r.kind === 'group') out.push(...summaryRows(c, r.name, p, true, depth + 1));
  }
  return out;
}

export function buildReport(c: Company, params: ReportParams, period: Period, opts: BuildOpts): ReportModel {
  switch (params.id) {
    case 'bs': {
      const bs = balanceSheetGroups(c, period.to);
      const asAt = { from: c.fyStart, to: period.to };
      const left = sideRows(c, bs.liabilities, asAt, opts.detailed, (r) => -r.closing);
      const right = sideRows(c, bs.assets, asAt, opts.detailed, (r) => r.closing);
      return twoSided('Balance Sheet', `as at ${formatDate(period.to)}`, 'Liabilities', 'Assets', left, right, bs.totalLiabilities, bs.totalAssets, opts,
        { note: bs.balanced ? undefined : 'Balance Sheet does not balance!' });
    }
    case 'ie': {
      const ie = ieGroups(c, period);
      const left = sideRows(c, ie.expenditure, period, opts.detailed, (r) => r.debit - r.credit);
      const right = sideRows(c, ie.income, period, opts.detailed, (r) => r.credit - r.debit);
      const total = Math.max(ie.totalExpenditure, ie.totalIncome);
      if (ie.surplus > 0) left.push({ cells: ['Excess of Income over Expenditure (Surplus)', amt(ie.surplus)], bold: true });
      else if (ie.surplus < 0) right.push({ cells: ['Excess of Expenditure over Income (Deficit)', amt(-ie.surplus)], bold: true });
      return twoSided('Income & Expenditure Account', range(period), 'Expenditure', 'Income', left, right, total, total, opts);
    }
    case 'rp': {
      const rp = receiptsPayments(c, period);
      const cb = c.ledgers.filter((l) => ['Cash-in-hand', 'Bank Accounts'].some((g) => isUnder(c.groups, l.group, g)));
      const left: Row[] = [{ cells: ['Opening Balance', ''], heading: true }];
      const right: Row[] = [];
      for (const l of cb) {
        const o = ledgerBalance(c, l.name, dayBefore(period.from));
        if (o !== 0) left.push({ cells: [l.name, amt(o)], indent: 1, drill: { id: 'ledger', ledger: l.name } });
      }
      left.push({ cells: ['Receipts', ''], heading: true });
      for (const r of rp.receipts) left.push({ cells: [r.name, amt(r.amount)], indent: 1, drill: { id: 'ledger', ledger: r.name } });
      right.push({ cells: ['Payments', ''], heading: true });
      for (const r of rp.payments) right.push({ cells: [r.name, amt(r.amount)], indent: 1, drill: { id: 'ledger', ledger: r.name } });
      right.push({ cells: ['Closing Balance', ''], heading: true });
      for (const l of cb) {
        const o = ledgerBalance(c, l.name, period.to);
        if (o !== 0) right.push({ cells: [l.name, amt(o)], indent: 1, drill: { id: 'ledger', ledger: l.name } });
      }
      const tl = rp.openingCashBank + rp.totalReceipts;
      const tr = rp.totalPayments + rp.closingCashBank;
      return twoSided('Receipts & Payments Account', range(period), 'Receipts', 'Payments', left, right, tl, tr, opts, {
        note: tl === tr ? undefined : `Difference: ${formatAmount(Math.abs(tl - tr))}`,
      });
    }
    case 'tb':
    case 'group': {
      const g = params.group ?? null;
      const rows = summaryRows(c, g, period, opts.detailed);
      const top = groupSummary(c, g, period);
      const sum = (f: (r: SummaryRow) => number) => top.reduce((s, r) => s + f(r), 0);
      rows.push({ cells: ['Grand Total', formatDrCr(sum((r) => r.opening)), amt(sum((r) => r.debit)), amt(sum((r) => r.credit)), formatDrCr(sum((r) => r.closing))], total: true, bold: true });
      const diff = sum((r) => r.closing);
      return {
        title: g === null ? 'Trial Balance' : `Group Summary: ${g}`, subtitle: range(period), layout: 'single',
        columns: ['Particulars', 'Opening Balance', 'Debit', 'Credit', 'Closing Balance'], numericFrom: 1, rows, canDetail: true, canVertical: false,
        note: g === null && diff !== 0 ? `Difference in Trial Balance: ${formatDrCr(diff)}` : undefined,
      };
    }
    case 'cashbank': {
      const rows: Row[] = [];
      let o = 0, d = 0, cr = 0, cl = 0;
      for (const grp of ['Cash-in-hand', 'Bank Accounts']) {
        const { ledgers } = groupChildren(c, grp);
        for (const r of groupSummary(c, grp, period).filter((x) => x.kind === 'ledger' && ledgers.some((l) => l.name === x.name))) {
          rows.push({ cells: [r.name, bal(r.opening), amt(r.debit), amt(r.credit), bal(r.closing)], drill: { id: 'ledger', ledger: r.name } });
          o += r.opening; d += r.debit; cr += r.credit; cl += r.closing;
        }
      }
      rows.push({ cells: ['Total', bal(o), amt(d), amt(cr), bal(cl)], total: true, bold: true });
      return { title: 'Cash/Bank Books', subtitle: range(period), layout: 'single', columns: ['Particulars', 'Opening Balance', 'Debit', 'Credit', 'Closing Balance'], numericFrom: 1, rows, canDetail: false, canVertical: false };
    }
    case 'ledger': {
      const name = params.ledger!;
      const la = ledgerAccount(c, name, period);
      const rows: Row[] = [{ cells: ['', 'Opening Balance', '', '', la.opening > 0 ? formatAmount(la.opening) : '', la.opening < 0 ? formatAmount(-la.opening) : ''], bold: true }];
      let dr = Math.max(la.opening, 0), cr = Math.max(-la.opening, 0);
      for (const r of la.rows) {
        rows.push({ cells: [formatDate(r.date), r.particulars, r.voucherType, r.voucherNo, amt(r.debit), amt(r.credit)], voucherId: r.voucherId });
        dr += r.debit; cr += r.credit;
      }
      const closeDr = la.closing < 0 ? -la.closing : 0;
      const closeCr = la.closing > 0 ? la.closing : 0;
      rows.push({ cells: ['', 'Closing Balance', '', '', amt(closeDr), amt(closeCr)], bold: true });
      rows.push({ cells: ['', 'Total', '', '', amt(dr + closeDr), amt(cr + closeCr)], total: true, bold: true });
      return { title: `Ledger: ${name}`, subtitle: range(period), layout: 'single', columns: ['Date', 'Particulars', 'Vch Type', 'Vch No.', 'Debit', 'Credit'], numericFrom: 4, rows, canDetail: false, canVertical: false };
    }
    case 'daybook': {
      const vs = dayBook(c, period);
      const rows: Row[] = vs.map((v) => {
        const total = v.entries.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0);
        const flag = v.cancelled ? ' (Cancelled)' : v.optional ? ' (Optional)' : v.postDated ? ' (Post-dated)' : '';
        return { cells: [formatDate(v.date), v.entries[0]?.ledger ?? '', v.type + flag, v.number, amt(total)], voucherId: v.id };
      });
      return { title: 'Day Book', subtitle: range(period), layout: 'single', columns: ['Date', 'Particulars', 'Vch Type', 'Vch No.', 'Amount'], numericFrom: 4, rows, canDetail: false, canVertical: false, voucherActions: true };
    }
    case 'outstanding': {
      const grp = params.billGroup ?? 'Sundry Debtors';
      const list = outstandingsReport(c, grp, period.to);
      const rows: Row[] = [];
      const tot = { total: 0, b0: 0, b30: 0, b60: 0, b90: 0 };
      for (const p of list) {
        rows.push({ cells: [p.party, '', amt(p.total), amt(p.buckets.b0), amt(p.buckets.b30), amt(p.buckets.b60), amt(p.buckets.b90)], bold: true, drill: { id: 'ledger', ledger: p.party } });
        if (opts.detailed) {
          for (const b of p.bills) rows.push({ cells: [b.ref, formatDate(b.date), amt(b.pending), amt(b.buckets.b0), amt(b.buckets.b30), amt(b.buckets.b60), amt(b.buckets.b90)], indent: 1 });
          if (p.onAccount) rows.push({ cells: ['On Account', '', amt(p.onAccount), '', '', '', ''], indent: 1 });
        }
        tot.total += p.total; tot.b0 += p.buckets.b0; tot.b30 += p.buckets.b30; tot.b60 += p.buckets.b60; tot.b90 += p.buckets.b90;
      }
      rows.push({ cells: ['Total', '', amt(tot.total), amt(tot.b0), amt(tot.b30), amt(tot.b60), amt(tot.b90)], total: true, bold: true });
      return {
        title: grp === 'Sundry Debtors' ? 'Bills Receivable' : 'Bills Payable', subtitle: `ageing as on ${formatDate(period.to)}`, layout: 'single',
        columns: ['Party / Ref', 'Date', 'Pending', '0-30 days', '31-60 days', '61-90 days', 'Over 90 days'], numericFrom: 2, rows, canDetail: true, canVertical: false,
      };
    }
    case 'stock': {
      const items = stockSummary(c);
      const rows: Row[] = items.map((i) => ({ cells: [i.item, i.unit, String(i.qty), amt(i.rate), amt(i.value)] }));
      rows.push({ cells: ['Total', '', '', '', amt(items.reduce((s, i) => s + i.value, 0))], total: true, bold: true });
      return { title: 'Stock Summary', subtitle: 'opening stock (stock vouchers not yet supported)', layout: 'single', columns: ['Particulars', 'Unit', 'Quantity', 'Rate', 'Value'], numericFrom: 2, rows, canDetail: false, canVertical: false };
    }
    case 'centres': {
      const list = costCentreSummary(c, period);
      const rows: Row[] = list.map((r) => ({ cells: [r.centre, r.category, amt(r.income), amt(r.expense), bal(r.income - r.expense).replace(/ Dr$/, ' Surplus').replace(/ Cr$/, ' Deficit')], drill: { id: 'centre', centre: r.centre } }));
      return { title: 'Fund / Project Statement', subtitle: range(period), layout: 'single', columns: ['Cost Centre', 'Category', 'Income', 'Expenditure', 'Net'], numericFrom: 2, rows, canDetail: false, canVertical: false };
    }
    case 'centre': {
      const st = costCentreStatement(c, params.centre!, period);
      const rows: Row[] = st.rows.map((r) => ({ cells: [r.ledger, r.net > 0 ? amt(r.net) : '', r.net < 0 ? amt(-r.net) : ''], drill: { id: 'ledger', ledger: r.ledger } }));
      return { title: `Cost Centre: ${params.centre}`, subtitle: range(period), layout: 'single', columns: ['Ledger', 'Debit', 'Credit'], numericFrom: 1, rows, canDetail: false, canVertical: false };
    }
    case 'ratio': {
      const rows: Row[] = ratios(c, period.to).map((r) => ({ cells: [r.name, r.value] }));
      return { title: 'Ratio Analysis', subtitle: `as at ${formatDate(period.to)}`, layout: 'single', columns: ['Particulars', 'Value'], numericFrom: 1, rows, canDetail: false, canVertical: false };
    }
    case 'mod': return buildModule(c, params.mod!, params.arg ?? '', period);
    case 'register': return buildRegisterView(c, params.reg!);
    case 'vat': {
      const v = vatSummary(c, period);
      const rows: Row[] = v.rows.map((r) => ({ cells: [r.ledger, amt(r.input), amt(r.output)], drill: { id: 'ledger', ledger: r.ledger } }));
      rows.push({ cells: ['Total', amt(v.totalInput), amt(v.totalOutput)], total: true, bold: true });
      rows.push({ cells: [v.payable >= 0 ? 'Net VAT payable' : 'Net VAT refundable / carried forward', '', amt(Math.abs(v.payable))], bold: true, heading: true });
      return { title: 'VAT Summary (simulated)', subtitle: range(period), layout: 'single', columns: ['VAT Ledger', 'Input VAT (Dr)', 'Output VAT (Cr)'], numericFrom: 1, rows, canDetail: false, canVertical: false };
    }
    case 'tds': {
      const list = tdsPayable(c, period, period.to);
      const rows: Row[] = list.map((r) => ({ cells: [r.ledger, amt(r.deducted), amt(r.deposited), amt(r.balance), amt(r.overdue), r.nextDue ? formatDate(r.nextDue) : ''], drill: { id: 'ledger', ledger: r.ledger } }));
      return { title: 'TDS Payable & Challan Tracker (simulated)', subtitle: `${range(period)} | due: 15th of following month`, layout: 'single', columns: ['TDS Ledger', 'Deducted', 'Deposited (challan)', 'Balance payable', 'Overdue', 'Next due'], numericFrom: 1, rows, canDetail: false, canVertical: false };
    }
    case 'funds': {
      const f = fundStatement(c, period);
      const rows: Row[] = f.map((r) => ({ cells: [r.fund, amt(r.opening), amt(r.additions), amt(r.utilised), amt(r.closing)], drill: { id: 'group', group: r.fund } }));
      rows.push({ cells: ['Total', amt(f.reduce((s, r) => s + r.opening, 0)), amt(f.reduce((s, r) => s + r.additions, 0)), amt(f.reduce((s, r) => s + r.utilised, 0)), amt(f.reduce((s, r) => s + r.closing, 0))], total: true, bold: true });
      return { title: 'Fund Statement', subtitle: range(period), layout: 'single', columns: ['Fund', 'Opening', 'Additions', 'Utilised', 'Closing'], numericFrom: 1, rows, canDetail: false, canVertical: false };
    }
  }
}

export function toCsv(m: ReportModel): string {
  const q = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const lines = [[m.title], [m.subtitle ?? ''], []].map((r) => r.map(q).join(','));
  if (m.layout === 'double') {
    lines.push([m.leftTitle ?? '', '', m.rightTitle ?? '', ''].map(q).join(','));
    m.rows.forEach((r, i) => lines.push([...r.cells, ...(m.right?.[i]?.cells ?? ['', ''])].map(q).join(',')));
  } else {
    lines.push(m.columns.map(q).join(','));
    for (const r of m.rows) lines.push(r.cells.map(q).join(','));
  }
  return lines.join('\n');
}

function buildRegisterView(c: Company, id: string): ReportModel {
  const def = regDef(id);
  const rowsx: Row[] = rows(c, id).map((r) => ({ cells: def.fields.map((f) => (f.type === 'amount' && r[f.key] ? formatAmount(toPaisa(r[f.key])) : f.type === 'date' && r[f.key] ? formatDate(r[f.key]) : r[f.key] ?? '')) }));
  return { title: def.title, subtitle: `${rowsx.length} record(s)`, layout: 'single', columns: def.fields.map((f) => f.label), rows: rowsx, numericFrom: 99, canDetail: false, canVertical: false };
}
