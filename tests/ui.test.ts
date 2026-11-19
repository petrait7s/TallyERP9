import { describe, expect, it } from 'vitest';
import { KeyRouter, normalizeKey } from '../src/ui/keys';
import { formatDate, parseTallyDate, weekday } from '../src/ui/dates';

describe('normalizeKey', () => {
  it('maps', () => {
    expect(normalizeKey({ key: 'Escape' })).toBe('Esc');
    expect(normalizeKey({ key: 'F8', ctrlKey: true })).toBe('Ctrl+F8');
    expect(normalizeKey({ key: 'c', altKey: true })).toBe('Alt+C');
    expect(normalizeKey({ key: 'Shift', shiftKey: true })).toBe('');
    expect(normalizeKey({ key: ' ' })).toBe('Space');
  });
});

describe('KeyRouter', () => {
  it('top handler first, then enabled buttons; pop restores', () => {
    const r = new KeyRouter();
    const log: string[] = [];
    r.push({ id: 'a', onKey: (k) => (k === 'Esc' ? (log.push('a-esc'), true) : false) });
    r.push({
      id: 'b',
      onKey: (k) => k === 'Esc' && (log.push('b-esc'), true),
      buttons: () => [{ key: 'F4', label: 'x', action: () => log.push('f4') }, { key: 'F5', label: 'y', disabled: true, action: () => log.push('f5') }],
    });
    r.dispatch({ key: 'Escape' });
    expect(r.dispatch({ key: 'F4' })).toBe(true);
    expect(r.dispatch({ key: 'F5' })).toBe(false);
    r.pop();
    r.dispatch({ key: 'Escape' });
    expect(log).toEqual(['b-esc', 'f4', 'a-esc']);
  });
});

describe('dates', () => {
  it('parses Tally shorthand', () => {
    expect(parseTallyDate('1-4-25', '2025-04-01')).toBe('2025-04-01');
    expect(parseTallyDate('15', '2025-06-03')).toBe('2025-06-15');
    expect(parseTallyDate('1/5', '2025-04-01')).toBe('2025-05-01');
    expect(parseTallyDate('31-2', '2025-04-01')).toBeNull();
    expect(parseTallyDate('x', '2025-04-01')).toBeNull();
  });
  it('formats', () => {
    expect(formatDate('2025-04-01')).toBe('1-Apr-2025');
    expect(weekday('2025-04-01')).toBe('Tuesday');
  });
});

import { DEFS, formatOpening, parseOpening } from '../src/ui/screens/masterDefs';
import { createCompany, createMaster, toPaisa } from '../src/engine';

describe('master form defs', () => {
  it('parses opening with Dr/Cr and default side', () => {
    expect(parseOpening('85,000', 'Dr')).toBe(toPaisa(85000));
    expect(parseOpening('2,00,000 cr', 'Dr')).toBe(-toPaisa(200000));
    expect(parseOpening('', 'Cr')).toBe(0);
    expect(parseOpening('10.5', 'Cr')).toBe(-1050);
    expect(() => parseOpening('abc', 'Dr')).toThrow();
    expect(formatOpening(-toPaisa(200000))).toBe('2,00,000.00 Cr');
  });
  it('ledger draft round-trip + default side from group nature', () => {
    const c = createCompany('T', '2025-04-01', '2026-03-31');
    const d = { ...DEFS.ledger.blank(c), name: 'Corpus', group: 'Corpus Fund', opening: '2,00,000' };
    const obj: any = DEFS.ledger.fromDraft(c, d);
    expect(obj.opening).toBe(-toPaisa(200000)); // liability group defaults to Cr
    createMaster(c, 'ledger', obj);
    expect(DEFS.ledger.toDraft(c, 'Corpus').opening).toBe('2,00,000.00 Cr');
  });
  it('currency rate scaling', () => {
    const c = createCompany('T', '2025-04-01', '2026-03-31');
    expect((DEFS.currency.fromDraft(c, { name: 'USD', symbol: '$', rate: '122.5' }) as any).rate).toBe(1225000);
  });
});
