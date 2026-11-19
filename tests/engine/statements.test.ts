import { describe, expect, it } from 'vitest';
import {
  addLedger, addVoucher, balanceSheet, balanceSheetGroups, costCentreSummary, createCompany, fundStatement,
  groupSummary, ieGroups, incomeExpenditure, outstandingsReport, ratios, receiptsPayments, toPaisa as P,
} from '../../src/engine';

function co() {
  const c = createCompany('T', '2025-04-01', '2026-03-31');
  addLedger(c, { name: 'Bank', group: 'Bank Accounts', opening: P(100000) });
  addLedger(c, { name: 'Equip', group: 'Fixed Assets', opening: P(50000) });
  addLedger(c, { name: 'Corpus', group: 'Corpus Fund', opening: -P(100000) });
  addLedger(c, { name: 'Capital', group: 'Capital Fund', opening: -P(50000) });
  addLedger(c, { name: 'Don', group: 'Donations', opening: 0 });
  addLedger(c, { name: 'Rent', group: 'Admin Expenses', opening: 0 });
  addLedger(c, { name: 'Pumps', group: 'Programme Expenses', opening: 0 });
  addLedger(c, { name: 'Rahim', group: 'Sundry Debtors', opening: 0, billWise: true });
  addLedger(c, { name: 'Sup', group: 'Sundry Creditors', opening: 0, billWise: true });
  addLedger(c, { name: 'Grant', group: 'Grants Received', opening: 0 });
  c.costCentres.push({ name: 'WASH', category: 'Primary Cost Category' });
  addVoucher(c, { type: 'Receipt', date: '2025-05-01', entries: [{ ledger: 'Bank', amount: P(20000) }, { ledger: 'Don', amount: -P(20000) }] });
  addVoucher(c, { type: 'Payment', date: '2025-05-05', entries: [
    { ledger: 'Pumps', amount: P(8000), costCentres: [{ costCentre: 'WASH', amount: P(8000) }] }, { ledger: 'Bank', amount: -P(8000) }] });
  addVoucher(c, { type: 'Payment', date: '2025-05-06', entries: [{ ledger: 'Rent', amount: P(3000) }, { ledger: 'Bank', amount: -P(3000) }] });
  return c;
}

describe('statements', () => {
  it('group-level BS equals ledger-level BS totals', () => {
    const c = co();
    const g = balanceSheetGroups(c);
    const l = balanceSheet(c);
    expect(g.balanced).toBe(true);
    expect(g.totalAssets).toBe(l.totalAssets);
    expect(g.liabilities[0].name).toBe('Income & Expenditure A/c');
    expect(g.liabilities[0].amount).toBe(P(9000));
  });
  it('opening imbalance shown as difference so BS still balances', () => {
    const c = createCompany('T', '2025-04-01', '2026-03-31');
    addLedger(c, { name: 'Bank', group: 'Bank Accounts', opening: P(500) });
    const g = balanceSheetGroups(c);
    expect(g.liabilities.find((x) => x.kind === 'diff')!.amount).toBe(P(500));
    expect(g.balanced).toBe(true);
  });
  it('I&E groups match ledger-level', () => {
    const c = co();
    const g = ieGroups(c);
    expect(g.surplus).toBe(incomeExpenditure(c).surplus);
    expect(g.expenditure.map((x) => x.name).sort()).toEqual(['Direct Expenses', 'Indirect Expenses']);
  });
  it('group summary: root TB nets to zero; sub-group drill', () => {
    const c = co();
    const root = groupSummary(c, null, { from: c.fyStart, to: c.fyEnd });
    expect(root.reduce((s, r) => s + r.closing, 0)).toBe(0);
    const direct = groupSummary(c, 'Direct Expenses', { from: c.fyStart, to: c.fyEnd });
    expect(direct.find((r) => r.name === 'Programme Expenses')!.debit).toBe(P(8000));
    const ledgers = groupSummary(c, 'Programme Expenses', { from: c.fyStart, to: c.fyEnd });
    expect(ledgers[0]).toMatchObject({ kind: 'ledger', name: 'Pumps', closing: P(8000) });
  });
  it('period filter changes opening', () => {
    const c = co();
    const rows = groupSummary(c, 'Bank Accounts', { from: '2025-05-02', to: c.fyEnd });
    expect(rows[0].opening).toBe(P(120000));
    expect(rows[0].closing).toBe(P(109000));
  });
  it('R&P totals tie: opening+receipts = payments+closing', () => {
    const c = co();
    const r = receiptsPayments(c);
    expect(r.openingCashBank + r.totalReceipts).toBe(r.totalPayments + r.closingCashBank);
  });
  it('outstandings ageing + on account', () => {
    const c = co();
    addVoucher(c, { type: 'Sales', date: '2025-05-01', entries: [
      { ledger: 'Rahim', amount: P(1000), bills: [{ method: 'New Ref', ref: 'A', amount: P(1000) }] }, { ledger: 'Grant', amount: -P(1000) }] });
    addVoucher(c, { type: 'Sales', date: '2025-07-20', entries: [
      { ledger: 'Rahim', amount: P(500), bills: [{ method: 'New Ref', ref: 'B', amount: P(500) }] }, { ledger: 'Grant', amount: -P(500) }] });
    addVoucher(c, { type: 'Receipt', date: '2025-07-21', entries: [{ ledger: 'Bank', amount: P(100) },
      { ledger: 'Rahim', amount: -P(100), bills: [{ method: 'On Account', ref: '', amount: P(100) }] }] });
    addVoucher(c, { type: 'Purchase', date: '2025-06-01', entries: [{ ledger: 'Pumps', amount: P(700) },
      { ledger: 'Sup', amount: -P(700), bills: [{ method: 'New Ref', ref: 'P1', amount: P(700) }] }] });
    const rec = outstandingsReport(c, 'Sundry Debtors', '2025-08-01');
    expect(rec).toHaveLength(1);
    expect(rec[0].buckets.b90).toBe(P(1000));
    expect(rec[0].buckets.b0).toBe(P(500));
    expect(rec[0].onAccount).toBe(-P(100));
    expect(rec[0].total).toBe(P(1400));
    const pay = outstandingsReport(c, 'Sundry Creditors', '2025-08-01');
    expect(pay[0].total).toBe(P(700));
    expect(pay[0].buckets.b60).toBe(P(700));
  });
  it('cost centre summary, fund statement, ratios', () => {
    const c = co();
    expect(costCentreSummary(c, { from: c.fyStart, to: c.fyEnd })).toEqual([{ centre: 'WASH', category: 'Primary Cost Category', income: 0, expense: P(8000) }]);
    const f = fundStatement(c, { from: c.fyStart, to: c.fyEnd });
    expect(f.map((x) => x.fund).sort()).toEqual(['Capital Fund', 'Corpus Fund']);
    expect(f.find((x) => x.fund === 'Corpus Fund')!.closing).toBe(P(100000));
    const r = ratios(c);
    expect(r[4].value).toBe('55.00 %');
  });
});
