import { describe, expect, it } from 'vitest';
import {
  addLedger, addVoucher, alterVoucher, amountInWords, balanceSheet, cancelVoucher, createCompany,
  costCentreStatement, duplicateVoucher, formatAmount, formatDrCr, groupPath, incomeExpenditure,
  ledgerAccount, ledgerBalance, receiptsPayments, toPaisa, trialBalance, AccountingError,
} from '../../src/engine';

function ngo() {
  const c = createCompany('Test NGO', '2025-04-01', '2026-03-31');
  addLedger(c, { name: 'Islami Bank', group: 'Bank Accounts', opening: toPaisa(100000) });
  addLedger(c, { name: 'Office Equipment', group: 'Fixed Assets', opening: toPaisa(50000) });
  addLedger(c, { name: 'Corpus Fund', group: 'Corpus Fund', opening: -toPaisa(100000) });
  addLedger(c, { name: 'Capital Fund', group: 'Capital Fund', opening: -toPaisa(50000) });
  addLedger(c, { name: 'Local Donations', group: 'Donations', opening: 0 });
  addLedger(c, { name: 'Rent', group: 'Admin Expenses', opening: 0 });
  addLedger(c, { name: 'Water Pumps', group: 'Programme Expenses', opening: 0 });
  c.costCentres.push({ name: 'WASH-Jaflong', category: 'Projects' });
  return c;
}

describe('money', () => {
  it('parses and formats lakh/crore', () => {
    expect(toPaisa('1,23,456.50')).toBe(12345650);
    expect(formatAmount(12345678900)).toBe('12,34,56,789.00');
    expect(formatAmount(-500)).toBe('-5.00');
    expect(formatDrCr(-12345600)).toBe('1,23,456.00 Cr');
  });
  it('rejects bad input', () => expect(() => toPaisa('abc')).toThrow());
  it('words', () => {
    expect(amountInWords(toPaisa(5000))).toBe('Taka Five Thousand Only');
    expect(amountInWords(toPaisa('1,23,456'))).toBe('Taka One Lakh Twenty-Three Thousand Four Hundred Fifty-Six Only');
    expect(amountInWords(toPaisa('10.50'))).toBe('Taka Ten and Fifty Paisa Only');
  });
});

describe('groups', () => {
  it('hierarchy', () => expect(groupPath(createCompany('x', '2025-04-01', '2026-03-31').groups, 'Donations'))
    .toEqual(['Direct Incomes', 'Donations']));
});

describe('vouchers', () => {
  it('rejects unbalanced / unknown / out-of-FY', () => {
    const c = ngo();
    expect(() => addVoucher(c, { type: 'Receipt', date: '2025-05-01', entries: [{ ledger: 'Islami Bank', amount: 100 }, { ledger: 'Local Donations', amount: -90 }] })).toThrow(AccountingError);
    expect(() => addVoucher(c, { type: 'Receipt', date: '2025-05-01', entries: [{ ledger: 'Nope', amount: 100 }, { ledger: 'Local Donations', amount: -100 }] })).toThrow(/Unknown ledger/);
    expect(() => addVoucher(c, { type: 'Receipt', date: '2027-05-01', entries: [{ ledger: 'Islami Bank', amount: 100 }, { ledger: 'Local Donations', amount: -100 }] })).toThrow(/financial year/);
  });
  it('auto numbers per type', () => {
    const c = ngo();
    const e = [{ ledger: 'Islami Bank', amount: 100 }, { ledger: 'Local Donations', amount: -100 }];
    expect(addVoucher(c, { type: 'Receipt', date: '2025-05-01', entries: e }).number).toBe('1');
    expect(addVoucher(c, { type: 'Receipt', date: '2025-05-02', entries: e }).number).toBe('2');
    expect(addVoucher(c, { type: 'Journal', date: '2025-05-02', entries: e }).number).toBe('1');
  });
});

describe('reports', () => {
  function withData() {
    const c = ngo();
    addVoucher(c, { type: 'Receipt', date: '2025-05-01', entries: [{ ledger: 'Islami Bank', amount: toPaisa(20000) }, { ledger: 'Local Donations', amount: -toPaisa(20000) }] });
    addVoucher(c, { type: 'Payment', date: '2025-05-05', entries: [
      { ledger: 'Water Pumps', amount: toPaisa(8000), costCentres: [{ costCentre: 'WASH-Jaflong', amount: toPaisa(8000) }] },
      { ledger: 'Islami Bank', amount: -toPaisa(8000) }] });
    addVoucher(c, { type: 'Payment', date: '2025-05-06', entries: [{ ledger: 'Rent', amount: toPaisa(3000) }, { ledger: 'Islami Bank', amount: -toPaisa(3000) }] });
    return c;
  }
  it('trial balance balances', () => {
    const c = withData();
    const tb = trialBalance(c);
    expect(tb.balanced).toBe(true);
    expect(ledgerBalance(c, 'Islami Bank')).toBe(toPaisa(109000));
  });
  it('I&E and NGO balance sheet balance; surplus -> fund side', () => {
    const c = withData();
    const ie = incomeExpenditure(c);
    expect(ie.surplus).toBe(toPaisa(9000));
    const bs = balanceSheet(c);
    expect(bs.balanced).toBe(true);
    expect(bs.liabilities.find((l) => l.name.startsWith('Income & Expenditure'))?.amount).toBe(toPaisa(9000));
  });
  it('R&P cash basis and opening/closing', () => {
    const c = withData();
    const rp = receiptsPayments(c);
    expect(rp.openingCashBank).toBe(toPaisa(100000));
    expect(rp.totalReceipts).toBe(toPaisa(20000));
    expect(rp.totalPayments).toBe(toPaisa(11000));
    expect(rp.openingCashBank + rp.totalReceipts - rp.totalPayments).toBe(rp.closingCashBank);
  });
  it('contra not in R&P; period filter', () => {
    const c = withData();
    addVoucher(c, { type: 'Contra', date: '2025-06-01', entries: [{ ledger: 'Cash', amount: 500 }, { ledger: 'Islami Bank', amount: -500 }] });
    expect(receiptsPayments(c).totalPayments).toBe(toPaisa(11000));
    expect(trialBalance(c, '2025-05-02').rows.find((r) => r.ledger === 'Local Donations')?.credit).toBe(toPaisa(20000));
  });
  it('cancel / alter / duplicate effects keep books balanced', () => {
    const c = withData();
    const v = c.vouchers[2];
    alterVoucher(c, v.id, { entries: [{ ledger: 'Rent', amount: toPaisa(4000) }, { ledger: 'Islami Bank', amount: -toPaisa(4000) }] });
    expect(incomeExpenditure(c).surplus).toBe(toPaisa(8000));
    duplicateVoucher(c, v.id);
    expect(incomeExpenditure(c).surplus).toBe(toPaisa(4000));
    cancelVoucher(c, v.id);
    expect(incomeExpenditure(c).surplus).toBe(toPaisa(8000));
    expect(trialBalance(c).balanced).toBe(true);
    expect(balanceSheet(c).balanced).toBe(true);
  });
  it('optional, post-dated, memorandum do not post', () => {
    const c = withData();
    const e = [{ ledger: 'Rent', amount: 100 }, { ledger: 'Islami Bank', amount: -100 }];
    addVoucher(c, { type: 'Payment', date: '2025-07-01', entries: e, optional: true });
    addVoucher(c, { type: 'Payment', date: '2025-07-01', entries: e, postDated: true });
    addVoucher(c, { type: 'Memorandum', date: '2025-07-01', entries: e });
    expect(ledgerBalance(c, 'Rent')).toBe(toPaisa(3000));
  });
  it('ledger account To/By and closing', () => {
    const c = withData();
    const la = ledgerAccount(c, 'Islami Bank', { from: c.fyStart, to: c.fyEnd });
    expect(la.opening).toBe(toPaisa(100000));
    expect(la.rows[0].particulars).toBe('By Local Donations'.replace('By', 'To'));
    expect(la.closing).toBe(toPaisa(109000));
  });
  it('cost centre statement', () => {
    const c = withData();
    expect(costCentreStatement(c, 'WASH-Jaflong', { from: c.fyStart, to: c.fyEnd }).net).toBe(toPaisa(8000));
  });
});
