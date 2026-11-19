import { describe, expect, it } from 'vitest';
import { addLedger, addVoucher, createCompany, toPaisa as P } from '../src/engine';
import { buildReport, toCsv } from '../src/ui/reports/build';

function co() {
  const c = createCompany('T', '2025-04-01', '2026-03-31');
  addLedger(c, { name: 'Bank', group: 'Bank Accounts', opening: P(100000) });
  addLedger(c, { name: 'Corpus', group: 'Corpus Fund', opening: -P(100000) });
  addLedger(c, { name: 'Don', group: 'Donations', opening: 0 });
  addLedger(c, { name: 'Rent', group: 'Admin Expenses', opening: 0 });
  addVoucher(c, { type: 'Receipt', date: '2025-05-01', entries: [{ ledger: 'Bank', amount: P(20000) }, { ledger: 'Don', amount: -P(20000) }] });
  addVoucher(c, { type: 'Payment', date: '2025-05-06', entries: [{ ledger: 'Rent', amount: P(3000) }, { ledger: 'Bank', amount: -P(3000) }] });
  return c;
}
const per = { from: '2025-04-01', to: '2026-03-31' };
const o = { detailed: false, vertical: false };

describe('report builders', () => {
  it('BS two sides equal length with matching totals; vertical and detailed variants', () => {
    const c = co();
    const m = buildReport(c, { id: 'bs' }, per, o);
    expect(m.layout).toBe('double');
    expect(m.rows).toHaveLength(m.right!.length);
    expect(m.rows.at(-1)!.cells[1]).toBe(m.right!.at(-1)!.cells[1]);
    expect(m.rows.at(-1)!.cells[1]).toBe('1,17,000.00');
    const v = buildReport(c, { id: 'bs' }, per, { detailed: true, vertical: true });
    expect(v.layout).toBe('single');
    expect(v.rows.some((r) => r.cells[0] === 'Bank' && (r.indent ?? 0) >= 1)).toBe(true);
  });
  it('I&E shows surplus and equal totals', () => {
    const m = buildReport(co(), { id: 'ie' }, per, o);
    expect(m.rows.some((r) => r.cells[0].includes('Surplus') && r.cells[1] === '17,000.00')).toBe(true);
    expect(m.rows.at(-1)!.cells[1]).toBe(m.right!.at(-1)!.cells[1]);
  });
  it('R&P totals tie', () => {
    const m = buildReport(co(), { id: 'rp' }, per, o);
    expect(m.note).toBeUndefined();
    expect(m.rows.at(-1)!.cells[1]).toBe(m.right!.at(-1)!.cells[1]);
  });
  it('TB grand total debit == credit and no difference note', () => {
    const m = buildReport(co(), { id: 'tb' }, per, o);
    const t = m.rows.at(-1)!;
    expect(t.cells[2]).toBe(t.cells[3]);
    expect(m.note).toBeUndefined();
  });
  it('ledger account opening/closing/total', () => {
    const m = buildReport(co(), { id: 'ledger', ledger: 'Bank' }, per, o);
    expect(m.rows[0].cells[4]).toBe('1,00,000.00');
    expect(m.rows.at(-2)!.cells[5]).toBe('1,17,000.00');
    expect(m.rows.at(-1)!.cells[4]).toBe(m.rows.at(-1)!.cells[5]);
    expect(m.rows[1].voucherId).toBeGreaterThan(0);
  });
  it('day book rows carry voucher ids; period filters', () => {
    const c = co();
    expect(buildReport(c, { id: 'daybook' }, per, o).rows).toHaveLength(2);
    expect(buildReport(c, { id: 'daybook' }, { from: '2025-05-02', to: '2026-03-31' }, o).rows).toHaveLength(1);
  });
  it('csv export', () => {
    const csv = toCsv(buildReport(co(), { id: 'tb' }, per, o));
    expect(csv.split('\n')[0]).toBe('Trial Balance');
    expect(csv).toContain('Grand Total');
  });
});
