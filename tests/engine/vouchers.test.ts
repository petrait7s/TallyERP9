import { describe, expect, it } from 'vitest';
import {
  addLedger, addVoucher, AccountingError, alterVoucher, createCompany, outstandingBills, toPaisa, LAYOUTS,
} from '../../src/engine';

function co() {
  const c = createCompany('T', '2025-04-01', '2026-03-31');
  addLedger(c, { name: 'Bank', group: 'Bank Accounts', opening: toPaisa(1000) });
  addLedger(c, { name: 'Bank2', group: 'Bank Accounts', opening: 0 });
  addLedger(c, { name: 'Rahim', group: 'Sundry Debtors', opening: 0, billWise: true });
  addLedger(c, { name: 'Sales', group: 'Sales Accounts', opening: 0 });
  addLedger(c, { name: 'Rent', group: 'Admin Expenses', opening: 0 });
  return c;
}
const P = toPaisa;

describe('voucher rules', () => {
  it('Contra only cash/bank', () => {
    const c = co();
    expect(() => addVoucher(c, { type: 'Contra', date: '2025-05-01', entries: [{ ledger: 'Rent', amount: 5 }, { ledger: 'Bank', amount: -5 }] })).toThrow(/Cash\/Bank/);
    addVoucher(c, { type: 'Contra', date: '2025-05-01', entries: [{ ledger: 'Cash', amount: 5 }, { ledger: 'Bank', amount: -5 }] });
  });
  it('Payment needs cash/bank Cr; Receipt needs Dr', () => {
    const c = co();
    expect(() => addVoucher(c, { type: 'Payment', date: '2025-05-01', entries: [{ ledger: 'Bank', amount: 5 }, { ledger: 'Rent', amount: -5 }] })).toThrow(/Account/);
    expect(() => addVoucher(c, { type: 'Receipt', date: '2025-05-01', entries: [{ ledger: 'Rent', amount: 5 }, { ledger: 'Sales', amount: -5 }] })).toThrow(/Account/);
    addVoucher(c, { type: 'Payment', date: '2025-05-01', entries: [{ ledger: 'Rent', amount: 5 }, { ledger: 'Bank', amount: -5 }] });
  });
  it('hotkeys', () => {
    expect(LAYOUTS.Payment.hotkey).toBe('F5');
    expect(LAYOUTS['Credit Note'].hotkey).toBe('Ctrl+F8');
  });
});

describe('bill-wise', () => {
  const sale = (c: ReturnType<typeof co>, ref = 'INV1', amt = 1000) =>
    addVoucher(c, { type: 'Sales', date: '2025-05-01', entries: [
      { ledger: 'Rahim', amount: P(amt), bills: [{ method: 'New Ref', ref, amount: P(amt) }] },
      { ledger: 'Sales', amount: -P(amt) }] });

  it('new ref creates outstanding; agst ref settles', () => {
    const c = co();
    sale(c);
    expect(outstandingBills(c, 'Rahim')).toEqual([{ ledger: 'Rahim', ref: 'INV1', pending: P(1000), date: '2025-05-01' }]);
    addVoucher(c, { type: 'Receipt', date: '2025-05-10', entries: [
      { ledger: 'Bank', amount: P(400) },
      { ledger: 'Rahim', amount: -P(400), bills: [{ method: 'Agst Ref', ref: 'INV1', amount: P(400) }] }] });
    expect(outstandingBills(c, 'Rahim')[0].pending).toBe(P(600));
    addVoucher(c, { type: 'Receipt', date: '2025-05-11', entries: [
      { ledger: 'Bank', amount: P(600) },
      { ledger: 'Rahim', amount: -P(600), bills: [{ method: 'Agst Ref', ref: 'INV1', amount: P(600) }] }] });
    expect(outstandingBills(c, 'Rahim')).toEqual([]);
  });
  it('rejects over-settlement, unknown ref, duplicate ref, non billwise ledger', () => {
    const c = co();
    sale(c);
    const rcpt = (ref: string, amt: number) => addVoucher(c, { type: 'Receipt', date: '2025-05-10', entries: [
      { ledger: 'Bank', amount: P(amt) },
      { ledger: 'Rahim', amount: -P(amt), bills: [{ method: 'Agst Ref', ref, amount: P(amt) }] }] });
    expect(() => rcpt('INV1', 1500)).toThrow(/exceeds/);
    expect(() => rcpt('NOPE', 10)).toThrow(/No pending bill/);
    expect(() => sale(c)).toThrow(/already exists/);
    expect(() => addVoucher(c, { type: 'Payment', date: '2025-05-01', entries: [
      { ledger: 'Rent', amount: 5, bills: [{ method: 'New Ref', ref: 'x', amount: 5 }] }, { ledger: 'Bank', amount: -5 }] })).toThrow(AccountingError);
  });
  it('advance and on account; opening bills', () => {
    const c = co();
    c.ledgers.find((l) => l.name === 'Rahim')!.openingBills = [{ ref: 'OPEN1', amount: P(300), date: '2025-03-15' }];
    expect(outstandingBills(c, 'Rahim')[0].ref).toBe('OPEN1');
    addVoucher(c, { type: 'Receipt', date: '2025-05-10', entries: [
      { ledger: 'Bank', amount: P(50) },
      { ledger: 'Rahim', amount: -P(50), bills: [{ method: 'Advance', ref: 'ADV1', amount: P(50) }] }] });
    addVoucher(c, { type: 'Receipt', date: '2025-05-12', entries: [
      { ledger: 'Bank', amount: P(20) },
      { ledger: 'Rahim', amount: -P(20), bills: [{ method: 'On Account', ref: '', amount: P(20) }] }] });
    const o = outstandingBills(c, 'Rahim');
    expect(o.find((b) => b.ref === 'ADV1')!.pending).toBe(-P(50));
    expect(o).toHaveLength(2);
  });
  it('altering a voucher re-validates excluding itself', () => {
    const c = co();
    const v = sale(c);
    alterVoucher(c, v.id, { entries: [
      { ledger: 'Rahim', amount: P(900), bills: [{ method: 'New Ref', ref: 'INV1', amount: P(900) }] },
      { ledger: 'Sales', amount: -P(900) }] });
    expect(outstandingBills(c, 'Rahim')[0].pending).toBe(P(900));
  });
});
