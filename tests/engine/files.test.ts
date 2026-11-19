import { describe, expect, it } from 'vitest';
import {
  addLedger, addVoucher, allFeatures, AccountingError, balanceSheetGroups, carryForward, checkIntegrity, createCompany, dueDate,
  incomeExpenditure, migrate, outstandingBills, parseCompanyFile, serializeCompany, taxAmount, tdsPayable, toPaisa as P, vatSummary,
} from '../../src/engine';

function co() {
  const c = createCompany('T', '2025-04-01', '2026-03-31');
  addLedger(c, { name: 'Bank', group: 'Bank Accounts', opening: P(1000) });
  addLedger(c, { name: 'Capital', group: 'Capital Fund', opening: -P(1000) });
  addLedger(c, { name: 'Don', group: 'Donations', opening: 0 });
  addLedger(c, { name: 'Rent', group: 'Admin Expenses', opening: 0 });
  addLedger(c, { name: 'Rahim', group: 'Sundry Debtors', opening: 0, billWise: true });
  addLedger(c, { name: 'VAT Output', group: 'Duties & Taxes', opening: 0, taxType: 'VAT', taxRate: 1500 });
  addLedger(c, { name: 'VAT Input', group: 'Duties & Taxes', opening: 0, taxType: 'VAT', taxRate: 1500 });
  addLedger(c, { name: 'TDS Payable', group: 'Duties & Taxes', opening: 0, taxType: 'TDS', taxRate: 1000 });
  addVoucher(c, { type: 'Receipt', date: '2025-05-01', entries: [{ ledger: 'Bank', amount: P(500) }, { ledger: 'Don', amount: -P(500) }] });
  addVoucher(c, { type: 'Sales', date: '2025-06-01', entries: [
    { ledger: 'Rahim', amount: P(115), bills: [{ method: 'New Ref', ref: 'S1', amount: P(115) }] },
    { ledger: 'Don', amount: -P(100) }, { ledger: 'VAT Output', amount: -P(15) }] });
  return c;
}

describe('files', () => {
  it('roundtrip serialize/parse', () => {
    const c = co();
    const r = parseCompanyFile(serializeCompany(c, 'abc'));
    expect(r.id).toBe('abc');
    expect(r.company.vouchers).toHaveLength(2);
    expect(r.company.version).toBe(1);
  });
  it('rejects bad files', () => {
    expect(() => parseCompanyFile('{')).toThrow(/bad JSON/);
    expect(() => parseCompanyFile('{"a":1}')).toThrow(/not a TallyLearn/i);
  });
  it('migrate fills defaults for v0 and refuses newer', () => {
    const old: any = structuredClone(createCompany('Old', '2025-04-01', '2026-03-31'));
    delete old.version; delete old.features; delete old.config; delete old.units;
    const m = migrate(old);
    expect(m.features).toEqual(allFeatures());
    expect(m.units).toEqual([]);
    expect(() => migrate({ ...old, version: 99 })).toThrow(/newer/);
  });
  it('feature gating in engine', () => {
    const c = co();
    c.features.costCentres = false;
    c.costCentres.push({ name: 'X', category: 'Primary Cost Category' });
    expect(() => addVoucher(c, { type: 'Payment', date: '2025-07-01', entries: [
      { ledger: 'Rent', amount: 5, costCentres: [{ costCentre: 'X', amount: 5 }] }, { ledger: 'Bank', amount: -5 }] })).toThrow(AccountingError);
  });
});

describe('integrity', () => {
  it('healthy company has no issues; corrupted one is reported', () => {
    const c = co();
    expect(checkIntegrity(c)).toEqual([]);
    c.vouchers[0].entries[0].amount += 1;
    c.vouchers[1].entries[0].ledger = 'Ghost';
    const issues = checkIntegrity(c);
    expect(issues.some((i) => /not balanced/.test(i))).toBe(true);
    expect(issues.some((i) => /unknown ledger "Ghost"/.test(i))).toBe(true);
  });
});

describe('carry forward', () => {
  it('closing becomes opening, result moves to P&L, bills carried, BS balances', () => {
    const c = co();
    const n = carryForward(c, 'T 2026-27', '2026-04-01', '2027-03-31');
    expect(n.vouchers).toEqual([]);
    expect(n.ledgers.find((l) => l.name === 'Bank')!.opening).toBe(P(1500));
    expect(n.ledgers.find((l) => l.name === 'Don')!.opening).toBe(0);
    expect(n.ledgers.find((l) => l.name === 'Rahim')!.openingBills).toEqual([{ ref: 'S1', amount: P(115), date: '2025-06-01' }]);
    const surplus = incomeExpenditure(c).surplus;
    expect(n.ledgers.find((l) => l.name === 'Profit & Loss A/c')!.opening).toBe(-surplus);
    expect(balanceSheetGroups(n, n.fyEnd).balanced).toBe(true);
    expect(outstandingBills(n, 'Rahim')).toHaveLength(1);
    expect(checkIntegrity(n)).toEqual([]);
  });
});

describe('statutory', () => {
  it('tax amount rounding', () => {
    expect(taxAmount(P(100), 1500)).toBe(P(15));
    expect(taxAmount(P('33.33'), 1500)).toBe(500);
  });
  it('VAT summary', () => {
    const v = vatSummary(co(), { from: '2025-04-01', to: '2026-03-31' });
    expect(v.totalOutput).toBe(P(15));
    expect(v.payable).toBe(P(15));
  });
  it('TDS due dates and FIFO overdue', () => {
    expect(dueDate('2025-12-20')).toBe('2026-01-15');
    const c = co();
    addVoucher(c, { type: 'Payment', date: '2025-05-10', entries: [{ ledger: 'Rent', amount: P(90) }, { ledger: 'Bank', amount: -P(80) }, { ledger: 'TDS Payable', amount: -P(10) }] });
    addVoucher(c, { type: 'Payment', date: '2025-06-10', entries: [{ ledger: 'Rent', amount: P(90) }, { ledger: 'Bank', amount: -P(80) }, { ledger: 'TDS Payable', amount: -P(10) }] });
    addVoucher(c, { type: 'Payment', date: '2025-06-20', entries: [{ ledger: 'TDS Payable', amount: P(10) }, { ledger: 'Bank', amount: -P(10) }] });
    const [r] = tdsPayable(c, { from: '2025-04-01', to: '2026-03-31' }, '2025-08-01');
    expect(r.deducted).toBe(P(20));
    expect(r.deposited).toBe(P(10));
    expect(r.balance).toBe(P(10));
    expect(r.overdue).toBe(P(10)); // second deduction due 15-Jul, unpaid
    expect(r.nextDue).toBe('2025-07-15');
  });
});
